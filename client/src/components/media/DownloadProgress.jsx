import React from 'react';
import { ArrowDownToLine, Loader2, ShieldCheck, XCircle, Film, Music } from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function DownloadProgress({
  format,
  onCancel,
}) {
  const isAudio = format?.type === 'audio';
  const Icon = isAudio ? Music : Film;
  const fmtSize = format?.size || format?.sizeMB;

  return (
    <Card variant="gradient" className="space-y-6 p-7 text-center animate-in zoom-in-95 duration-200">
      <div className="w-16 h-16 rounded-2xl bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40 flex items-center justify-center mx-auto shadow-lg shadow-cyan-950/40">
        <ArrowDownToLine className="w-8 h-8 animate-bounce text-brand-cyan" />
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <Badge variant="cyan" size="md">
          Direct Browser Download Active
        </Badge>
        <h3 className="text-lg sm:text-xl font-bold text-white">
          Streaming Directly to Browser Downloads
        </h3>
        <p className="text-xs text-slate-300">
          Format: <strong className="text-white">{format?.label || format?.formatId} ({format?.container?.toUpperCase() || 'MP4'})</strong>
          {fmtSize && <span className="text-brand-cyan font-bold ml-1.5">• {fmtSize}</span>}
        </p>
        <p className="text-[12px] text-slate-300 leading-relaxed pt-2 bg-dark-900/60 p-3 rounded-xl border border-white/10">
          Check your browser's <strong>Downloads tray (Ctrl + J)</strong> to see real-time download speed, total size, and progress bar at maximum network bandwidth.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        {onCancel && (
          <Button variant="secondary" size="md" onClick={onCancel} icon={XCircle}>
            Close
          </Button>
        )}
      </div>
    </Card>
  );
}
