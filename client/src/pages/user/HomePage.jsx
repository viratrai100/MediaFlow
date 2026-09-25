import React from 'react';
import { Sparkles, ArrowDownToLine, Info, ShieldAlert, XCircle } from 'lucide-react';
import { useDownload } from '../../context/DownloadContext';
import PlatformSelector from '../../components/media/PlatformSelector';
import UrlInputField from '../../components/media/UrlInputField';
import MediaPreviewCard from '../../components/media/MediaPreviewCard';
import FormatSelector from '../../components/media/FormatSelector';
import DownloadProgress from '../../components/media/DownloadProgress';
import DownloadResult from '../../components/media/DownloadResult';
import HowItWorks from '../../components/media/HowItWorks';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import Loader from '../../components/common/Loader';

export default function HomePage() {
  const {
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
    fetchMedia,
    startDownload,
    cancelCurrentJob,
    resetDownloader,
  } = useDownload();

  const handleFormSubmit = (e) => {
    e.preventDefault();
    fetchMedia();
  };

  const handleSelectPlatformSample = (sampleUrl) => {
    setUrl(sampleUrl);
    fetchMedia(sampleUrl);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Hero Header */}
      <section className="text-center space-y-5 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/30 text-brand-purple text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>High-Performance Node.js Stream Delivery</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
          Social Video Downloader <br />
          <span className="text-gradient">High-Fidelity Multi-Quality Engine</span>
        </h1>

        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
          Paste any public video or audio URL. Multiplex, extract, and stream directly to your device
          with high fidelity and zero server disk accumulation.
        </p>

        {/* URL Input Form */}
        <UrlInputField
          url={url}
          onChangeUrl={setUrl}
          onSubmit={handleFormSubmit}
          isLoading={status === 'fetching'}
          detectedPlatform={detectedPlatform}
          onClear={() => setUrl('')}
        />

        {/* Platform sample pills */}
        <PlatformSelector
          selectedPlatform={detectedPlatform}
          onSelectPlatform={handleSelectPlatformSample}
        />
      </section>

      {/* Error State Banner */}
      {status === 'error' && errorMessage && (
        <Alert
          variant="error"
          title="Stream Ingestion Error"
          onClose={resetDownloader}
          className="max-w-3xl mx-auto animate-in fade-in duration-200"
        >
          {errorMessage}
        </Alert>
      )}

      {/* Cancelled State Banner */}
      {status === 'cancelled' && (
        <Alert
          variant="warning"
          title="Download Cancelled"
          onClose={resetDownloader}
          className="max-w-3xl mx-auto animate-in fade-in duration-200"
        >
          Your download job was cancelled. You can select another format or download a new stream.
        </Alert>
      )}

      {/* Fetching Media Loader */}
      {status === 'fetching' && (
        <Card className="max-w-2xl mx-auto p-10 text-center space-y-4">
          <Loader size="lg" text="Resolving public media manifests and analyzing format tables..." />
        </Card>
      )}

      {/* Ready State: Media Info & Format Chooser */}
      {status === 'ready' && mediaInfo && (
        <div className="max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-300">
          <Card variant="gradient" className="space-y-6">
            <MediaPreviewCard mediaInfo={mediaInfo} />

            <FormatSelector
              formats={mediaInfo.formats}
              selectedFormat={selectedFormat}
              onSelectFormat={setSelectedFormat}
            />

            <div className="pt-2">
              <Button
                onClick={startDownload}
                disabled={status === 'downloading' || status === 'fetching'}
                isLoading={status === 'downloading'}
                variant="primary"
                size="lg"
                icon={ArrowDownToLine}
                className="w-full font-bold shadow-glow-purple"
              >
                Start Stream Download ({selectedFormat?.label || selectedFormat?.formatId || 'Selected'})
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Downloading Stream State */}
      {status === 'downloading' && (
        <div className="max-w-2xl mx-auto">
          <DownloadProgress
            format={selectedFormat}
            onCancel={cancelCurrentJob}
          />
        </div>
      )}

      {/* Completed State */}
      {status === 'completed' && (
        <div className="max-w-2xl mx-auto">
          <DownloadResult
            mediaInfo={mediaInfo}
            format={selectedFormat}
            onReset={resetDownloader}
          />
        </div>
      )}

      {/* How it works 3-step section */}
      <HowItWorks />
    </div>
  );
}
