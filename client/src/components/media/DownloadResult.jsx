import React from 'react';
import { CheckCircle2, Download, ArrowRight, RotateCcw, Share2, Sparkles, FileCheck } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useDownload } from '../../context/DownloadContext';

export default function DownloadResult({ mediaInfo, format, onReset }) {
  const { downloadReadyUrl } = useDownload();

  const handleCopyLink = () => {
    if (mediaInfo?.url) {
      navigator.clipboard.writeText(mediaInfo.url);
      alert('Original media link copied to clipboard!');
    }
  };

  const handleSaveFileAgain = () => {
    if (downloadReadyUrl) {
      const cleanExt = (format?.container || 'mp4').replace(/^\./, '');
      const cleanTitle = (mediaInfo?.title || 'media').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'SocialStream_Download';
      const link = document.createElement('a');
      link.href = downloadReadyUrl;
      link.setAttribute('download', `${cleanTitle}.${cleanExt}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card variant="gradient" className="text-center space-y-6 p-8 animate-in zoom-in-95 duration-300">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div className="space-y-2 max-w-lg mx-auto">
        <Badge variant="success" size="md">
          Download Completed Successfully
        </Badge>
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Your Media Is Ready!
        </h2>
        <p className="text-xs text-slate-300 line-clamp-2">
          {mediaInfo?.title}
        </p>
        <p className="text-[11px] text-slate-400">
          Format: <strong className="text-white">{format?.label || format?.formatId} ({format?.container || 'MP4'})</strong> • Quality: <strong className="text-white">{format?.quality || format?.formatId || 'Original'}</strong>
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {downloadReadyUrl && (
          <Button
            onClick={handleSaveFileAgain}
            variant="primary"
            size="md"
            icon={Download}
            className="shadow-glow-purple font-bold"
          >
            Save / Download File Now
          </Button>
        )}

        <Button
          onClick={onReset}
          variant={downloadReadyUrl ? "secondary" : "primary"}
          size="md"
          icon={RotateCcw}
        >
          Download Another Media
        </Button>

        <Button
          onClick={handleCopyLink}
          variant="secondary"
          size="md"
          icon={Share2}
        >
          Copy Media URL
        </Button>
      </div>
    </Card>
  );
}
