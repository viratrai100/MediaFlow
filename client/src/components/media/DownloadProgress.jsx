import React from 'react';
import { ArrowDownToLine, Loader2, ShieldCheck, XCircle, Film, Music, Activity, Gauge, Clock } from 'lucide-react';
import { useDownload } from '../../context/DownloadContext';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function DownloadProgress({
  format,
  onCancel,
}) {
  const { progress, downloadSpeed, downloadedBytes, etaSeconds } = useDownload();
  const isAudio = format?.type === 'audio';
  const Icon = isAudio ? Music : Film;
  const fmtSize = format?.size || format?.sizeMB;

  const isPreparing = progress === 0 && (downloadSpeed.includes('Preparing') || downloadedBytes === '0 MB');

  return (
    <Card variant="gradient" className="space-y-6 p-7 text-center animate-in zoom-in-95 duration-200">
      <div className="w-16 h-16 rounded-2xl bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40 flex items-center justify-center mx-auto shadow-lg shadow-cyan-950/40">
        <ArrowDownToLine className={`w-8 h-8 text-brand-cyan ${isPreparing ? 'animate-pulse' : 'animate-bounce'}`} />
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <Badge variant={isPreparing ? 'purple' : 'cyan'} size="md">
          {isPreparing ? 'Stream Pipeline Initializing' : 'Direct Stream Active'}
        </Badge>
        <h3 className="text-lg sm:text-xl font-bold text-white">
          {isPreparing ? 'Preparing High-Quality Media' : 'Streaming Media to Your Device'}
        </h3>
        <p className="text-xs text-slate-300">
          Format: <strong className="text-white">{format?.label || format?.formatId} ({format?.container?.toUpperCase() || 'MP4'})</strong>
          {fmtSize && <span className="text-brand-cyan font-bold ml-1.5">• Estimated: {fmtSize}</span>}
        </p>
      </div>

      {/* Real-time Progress Bar */}
      <div className="space-y-3 max-w-md mx-auto">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-brand-cyan" />
            Transferred: <strong className="text-white">{isPreparing ? 'Buffering source...' : (downloadedBytes || '0 MB')}</strong>
          </span>
          <span className="text-brand-cyan font-mono text-xs">
            {progress > 0 ? `${progress}%` : (isPreparing ? 'Preparing pipeline...' : 'Streaming...')}
          </span>
        </div>

        <div className="w-full bg-dark-900/80 rounded-full h-3 p-0.5 border border-white/10 overflow-hidden shadow-inner relative">
          {progress > 0 ? (
            <div
              className="bg-gradient-to-r from-brand-purple via-brand-cyan to-brand-cyan h-full rounded-full transition-all duration-300 shadow-glow-cyan"
              style={{ width: `${Math.max(progress, 5)}%` }}
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-r from-brand-purple/40 via-brand-cyan/60 to-brand-purple/40 animate-pulse" />
          )}
        </div>

        {/* Telemetry Stats */}
        <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
          <span className="flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-brand-cyan" />
            Speed: <strong className="text-slate-200">{isPreparing ? 'Assembling stream...' : downloadSpeed}</strong>
          </span>
          {etaSeconds > 0 ? (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              ETA: <strong className="text-slate-200">~{etaSeconds}s</strong>
            </span>
          ) : (
            <span className="text-slate-500 text-[10px]">
              {isPreparing ? 'Connecting upstream CDN...' : 'High-speed pipeline active'}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        {onCancel && (
          <Button variant="secondary" size="md" onClick={onCancel} icon={XCircle}>
            Cancel Stream
          </Button>
        )}
      </div>
    </Card>
  );
}
