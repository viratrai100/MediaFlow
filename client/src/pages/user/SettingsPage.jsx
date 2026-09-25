import React, { useState } from 'react';
import { Sliders, Check, Bell, Shield, HardDrive, RefreshCw, Sparkles, Smartphone } from 'lucide-react';
import { useDownload } from '../../context/DownloadContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function SettingsPage() {
  const { settings, updateSettings, clearAllHistory } = useDownload();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggle = (key) => {
    updateSettings({ [key]: !settings[key] });
    triggerSaveAlert();
  };

  const handleChange = (key, value) => {
    updateSettings({ [key]: value });
    triggerSaveAlert();
  };

  const triggerSaveAlert = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-purple/20 text-brand-purple flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Client Preferences & Settings</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure default format resolutions, clipboard behaviors, and client storage.
          </p>
        </div>

        {savedSuccess && (
          <Badge variant="success" size="sm" className="animate-in fade-in duration-200">
            Preferences Saved
          </Badge>
        )}
      </div>

      <div className="space-y-6">
        {/* Media & Download Defaults */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-purple" />
            Media & Quality Presets
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-white/5">
              <div>
                <p className="font-semibold text-white">Default Video Resolution</p>
                <p className="text-slate-400">Preferred target resolution when parsing new video links.</p>
              </div>
              <select
                value={settings.defaultQuality}
                onChange={(e) => handleChange('defaultQuality', e.target.value)}
                className="bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-purple"
              >
                <option value="1080p">1080p Full HD</option>
                <option value="720p">720p HD</option>
                <option value="480p">480p SD</option>
                <option value="360p">360p Low</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-white/5">
              <div>
                <p className="font-semibold text-white">Preferred Audio Container</p>
                <p className="text-slate-400">Default format when extracting audio tracks.</p>
              </div>
              <select
                value={settings.preferredAudioExt}
                onChange={(e) => handleChange('preferredAudioExt', e.target.value)}
                className="bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-purple"
              >
                <option value="MP3">MP3 (Universal 320k/128k)</option>
                <option value="M4A">M4A / AAC (Master Bitrate)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Behavior & Clipboard */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-brand-cyan" />
            Clipboard & Interaction
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <p className="font-semibold text-white">Auto-Detect Clipboard URLs</p>
                <p className="text-slate-400">Offer quick paste actions when valid media URLs are copied.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoPasteClipboard}
                onChange={() => handleToggle('autoPasteClipboard')}
                className="w-4 h-4 accent-brand-purple rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <p className="font-semibold text-white">Download Notifications</p>
                <p className="text-slate-400">Show desktop and in-app completion alerts.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.showToastAlerts}
                onChange={() => handleToggle('showToastAlerts')}
                className="w-4 h-4 accent-brand-purple rounded cursor-pointer"
              />
            </div>
          </div>
        </Card>

        {/* Privacy & Storage */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Storage & Local Data
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <p className="font-semibold text-white">Clear Local History on Tab Close</p>
                <p className="text-slate-400">Automatically wipe stored download activity when browser session ends.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.clearOnExit}
                onChange={() => handleToggle('clearOnExit')}
                className="w-4 h-4 accent-brand-purple rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-semibold text-white">Purge Stored Cache & History</p>
                <p className="text-slate-400">Instantly delete all cached thumbnails and downloaded items.</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  clearAllHistory();
                  alert('Local history purged.');
                }}
              >
                Purge All
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
