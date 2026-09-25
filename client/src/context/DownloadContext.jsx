import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { apiService } from '../services/apiService';
import { mockFetchMediaInfo, detectPlatform, PLATFORMS } from '../services/mockMediaService';

const DownloadContext = createContext(null);

export function DownloadProvider({ children }) {
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState(null);
  const [mediaInfo, setMediaInfo] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'fetching' | 'ready' | 'downloading' | 'completed' | 'error' | 'cancelled'
  const [errorMessage, setErrorMessage] = useState(null);

  // Active Job State
  const [currentJobId, setCurrentJobId] = useState(null);
  const pollingTimerRef = useRef(null);

  // Download streaming telemetry
  const [progress, setProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState('0.0 MB/s');
  const [downloadedBytes, setDownloadedBytes] = useState('0 MB');
  const [etaSeconds, setEtaSeconds] = useState(0);

  // History state
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('socialstream_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });


  // Settings State
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('socialstream_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      defaultQuality: '1080p',
      preferredAudioExt: 'MP3',
      autoPasteClipboard: true,
      showToastAlerts: true,
      clearOnExit: false,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('socialstream_history', JSON.stringify(history));
    } catch (e) {}
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem('socialstream_settings', JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  useEffect(() => {
    if (url.trim()) {
      setDetectedPlatform(detectPlatform(url));
    } else {
      setDetectedPlatform(null);
    }
  }, [url]);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, []);

  // Fetch Media Info from live Express backend (or fallback to mock if detached)
  const fetchMedia = async (targetUrl) => {
    const inputUrl = targetUrl || url;
    if (!inputUrl.trim()) {
      setErrorMessage('Please enter a valid social media URL.');
      setStatus('error');
      return;
    }

    setStatus('fetching');
    setErrorMessage(null);
    setMediaInfo(null);
    setProgress(0);

    try {
      let info;
      try {
        info = await apiService.fetchMediaInfo(inputUrl);
        if (typeof info.platform === 'string') {
          const matched = Object.values(PLATFORMS).find((p) => p.id === info.platform) || PLATFORMS.DIRECT;
          info.platform = matched;
        }
      } catch (backendErr) {
        info = await mockFetchMediaInfo(inputUrl);
      }

      setMediaInfo(info);
      const initialFmt = info.formats?.find((f) => f.recommended) || info.formats?.[0];
      setSelectedFormat(initialFmt);
      setStatus('ready');
    } catch (err) {
      setErrorMessage(err.response?.data?.error?.message || err.message || 'Failed to extract media information.');
      setStatus('error');
    }
  };

  // Polling control refs
  const pollingActiveRef = useRef(false);
  const pollingTimeoutRef = useRef(null);
  const [downloadReadyUrl, setDownloadReadyUrl] = useState(null);

  const stopPolling = () => {
    pollingActiveRef.current = false;
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  };

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // Helper: Trigger genuine browser file download via native download manager
  const triggerBrowserDownload = (downloadUrl, title, extension = 'mp4') => {
    try {
      const cleanExt = (extension || 'mp4').replace(/^\./, '');
      const cleanTitle = (title || 'media').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'SocialStream_Download';
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${cleanTitle}.${cleanExt}`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 2000);
    } catch (e) {
      console.error('Failed to trigger browser download:', e);
    }
  };

  // Start Real Browser Stream Download Immediately
  const startDownload = async () => {
    if (!mediaInfo || !selectedFormat || status === 'downloading' || status === 'fetching') return;

    stopPolling();
    setErrorMessage(null);

    try {
      // Build direct HTTP streaming URL with selected quality format
      const downloadUrl = apiService.getDownloadUrl(
        mediaInfo.url,
        selectedFormat.formatId || selectedFormat.quality || '720p',
        mediaInfo.title
      );

      setDownloadReadyUrl(downloadUrl);
      setStatus('downloading');

      // Trigger browser's native download manager immediately
      triggerBrowserDownload(downloadUrl, mediaInfo.title, selectedFormat.container || 'mp4');

      // Record in local history
      recordHistoryItem(selectedFormat.sizeMB || selectedFormat.size || 'Direct Stream');

      // Set status to completed so user has access to re-download / actions
      setTimeout(() => {
        setStatus('completed');
      }, 500);

    } catch (err) {
      stopPolling();
      setStatus('error');
      setErrorMessage(err.message || 'Could not initiate download.');
    }
  };

  const recordHistoryItem = (sizeMB) => {
    const newHistoryItem = {
      id: 'hist_' + Date.now(),
      title: mediaInfo?.title || 'Media Stream',
      platform: mediaInfo?.platform?.name || mediaInfo?.platform || 'Social',
      format: `${selectedFormat?.label || selectedFormat?.formatId} (${selectedFormat?.container || 'MP4'})`,
      type: selectedFormat?.type || 'video',
      size: `${sizeMB || selectedFormat?.sizeMB || 'Direct'} MB`,
      thumbnail: mediaInfo?.thumbnail,
      timestamp: new Date().toISOString(),
      url: mediaInfo?.url
    };
    setHistory((prev) => [newHistoryItem, ...prev]);
  };

  // Cancel active job
  const cancelCurrentJob = async () => {
    stopPolling();

    if (currentJobId) {
      try {
        await apiService.cancelJob(currentJobId);
      } catch (e) {}
    }

    setStatus('cancelled');
    setErrorMessage('Download was cancelled.');
  };

  const resetDownloader = () => {
    stopPolling();
    setUrl('');
    setMediaInfo(null);
    setSelectedFormat(null);
    setStatus('idle');
    setErrorMessage(null);
    setProgress(0);
    setCurrentJobId(null);
    setDownloadReadyUrl(null);
  };

  const deleteHistoryItem = (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAllHistory = () => {
    setHistory([]);
  };

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <DownloadContext.Provider
      value={{
        url,
        setUrl,
        detectedPlatform,
        mediaInfo,
        selectedFormat,
        setSelectedFormat,
        status,
        errorMessage,
        progress,
        downloadSpeed,
        downloadedBytes,
        etaSeconds,
        history,
        settings,
        downloadReadyUrl,
        fetchMedia,
        startDownload,
        cancelCurrentJob,
        resetDownloader,
        deleteHistoryItem,
        clearAllHistory,
        updateSettings,
      }}
    >
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownload() {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error('useDownload must be used within a DownloadProvider');
  }
  return context;
}
