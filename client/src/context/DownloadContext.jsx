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
  const [downloadReadyUrl, setDownloadReadyUrl] = useState(null);
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

  // AbortController ref for cancelable downloads
  const activeDownloadAbortRef = useRef(null);

  // Fetch Media Info from live Express backend
  const fetchMedia = async (targetUrl) => {
    const inputUrl = targetUrl || url;
    if (!inputUrl || !inputUrl.trim()) {
      setErrorMessage('Please enter a valid social media URL.');
      setStatus('error');
      return;
    }

    setStatus('fetching');
    setErrorMessage(null);
    setMediaInfo(null);
    setProgress(0);

    try {
      const info = await apiService.fetchMediaInfo(inputUrl.trim());
      if (typeof info.platform === 'string') {
        const matched = Object.values(PLATFORMS).find((p) => p.id === info.platform) || PLATFORMS.DIRECT;
        info.platform = matched;
      }

      setMediaInfo(info);
      const initialFmt = info.formats?.find((f) => f.recommended) || info.formats?.[0];
      setSelectedFormat(initialFmt);
      setStatus('ready');
    } catch (err) {
      let errorMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to extract media information from source.';

      if (err.code === 'ECONNABORTED' || errorMsg.includes('timeout')) {
        errorMsg = 'Request timed out while contacting server. The cloud server may be waking up from sleep mode. Please try again.';
      }

      setErrorMessage(errorMsg);
      setStatus('error');
    }
  };

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

  // Start Real Browser Stream Download with Authentic Progress & Error Interception
  const startDownload = async () => {
    if (!mediaInfo || !selectedFormat || status === 'downloading' || status === 'fetching') return;

    setErrorMessage(null);
    setProgress(0);
    setDownloadedBytes('0 MB');
    setDownloadSpeed('Preparing stream pipeline...');
    setStatus('downloading');

    const abortController = new AbortController();
    activeDownloadAbortRef.current = abortController;
    const timeoutId = setTimeout(() => {
      if (activeDownloadAbortRef.current) {
        activeDownloadAbortRef.current.abort();
        setErrorMessage('Stream connection timed out after 90 seconds. Please retry or choose another quality format.');
        setStatus('error');
      }
    }, 90000);

    try {
      // Build direct HTTP streaming URL with selected quality format
      const downloadUrl = apiService.getDownloadUrl(
        mediaInfo.url,
        selectedFormat.formatId || selectedFormat.quality || '720p',
        mediaInfo.title
      );

      // Perform streaming fetch with AbortSignal
      const response = await fetch(downloadUrl, {
        signal: abortController.signal
      });

      clearTimeout(timeoutId);

      // Intercept non-200 responses (HTTP 400 / 403 / 500)
      if (!response.ok) {
        let errMsg = `Server returned HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          errMsg = errJson.error?.message || errJson.message || errMsg;
        } catch (jsonErr) {
          const rawText = await response.text().catch(() => '');
          if (rawText) errMsg = rawText;
        }
        throw new Error(errMsg);
      }

      setDownloadSpeed('Receiving stream...');

      // Stream binary response chunks while computing real-time speed & progress
      const contentLengthHeader = response.headers.get('Content-Length');
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;
      const reader = response.body.getReader();
      const chunks = [];
      let receivedBytes = 0;
      let lastTime = Date.now();
      let lastBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        const receivedMBStr = (receivedBytes / (1024 * 1024)).toFixed(1) + ' MB';
        setDownloadedBytes(receivedMBStr);

        if (totalBytes > 0) {
          const pct = Math.min(Math.round((receivedBytes / totalBytes) * 100), 99);
          setProgress(pct);
        }

        const now = Date.now();
        if (now - lastTime >= 200) {
          const bytesDiff = receivedBytes - lastBytes;
          const timeDiffSec = (now - lastTime) / 1000;
          if (timeDiffSec > 0) {
            const speedBps = bytesDiff / timeDiffSec;
            const speedMBs = (speedBps / (1024 * 1024)).toFixed(1);
            setDownloadSpeed(`${speedMBs} MB/s`);

            if (totalBytes > receivedBytes && speedBps > 0) {
              setEtaSeconds(Math.max(1, Math.round((totalBytes - receivedBytes) / speedBps)));
            }
          }
          lastTime = now;
          lastBytes = receivedBytes;
        }
      }

      // Assemble Blob and trigger browser save
      const extension = selectedFormat.container || (selectedFormat.type === 'audio' ? 'mp3' : 'mp4');
      const mimeType = selectedFormat.type === 'audio' ? 'audio/mpeg' : 'video/mp4';
      const blob = new Blob(chunks, { type: response.headers.get('Content-Type') || mimeType });
      const blobUrl = URL.createObjectURL(blob);
      setDownloadReadyUrl(blobUrl);

      triggerBrowserDownload(blobUrl, mediaInfo.title, extension);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);

      setProgress(100);
      setStatus('completed');
      recordHistoryItem((receivedBytes / (1024 * 1024)).toFixed(1));

    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus('cancelled');
        setErrorMessage('Download was cancelled.');
      } else {
        setStatus('error');
        setErrorMessage(err.message || 'Download request failed.');
      }
    } finally {
      activeDownloadAbortRef.current = null;
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

  // Cancel active download
  const cancelCurrentJob = () => {
    if (activeDownloadAbortRef.current) {
      activeDownloadAbortRef.current.abort();
    }
    setStatus('cancelled');
    setErrorMessage('Download was cancelled.');
  };

  const resetDownloader = () => {
    if (activeDownloadAbortRef.current) {
      activeDownloadAbortRef.current.abort();
    }
    setUrl('');
    setMediaInfo(null);
    setSelectedFormat(null);
    setDownloadReadyUrl(null);
    setStatus('idle');
    setErrorMessage(null);
    setProgress(0);
    setDownloadedBytes('0 MB');
    setDownloadSpeed('0.0 MB/s');
    setEtaSeconds(0);
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
