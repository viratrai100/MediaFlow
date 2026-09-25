import React from 'react';
import { BarChart3, PieChart, TrendingUp, Globe, DownloadCloud, HardDriveDownload } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

export default function AdminAnalytics() {
  const platformBreakdown = [
    { platform: 'YouTube', percentage: 54, count: '12,450 reqs', color: 'bg-rose-500' },
    { platform: 'TikTok', percentage: 22, count: '5,060 reqs', color: 'bg-brand-cyan' },
    { platform: 'Instagram', percentage: 14, count: '3,220 reqs', color: 'bg-brand-purple' },
    { platform: 'X / Twitter', percentage: 7, count: '1,610 reqs', color: 'bg-blue-400' },
    { platform: 'Vimeo', percentage: 3, count: '690 reqs', color: 'bg-emerald-400' },
  ];

  const formatBreakdown = [
    { format: '1080p MP4 Video', share: '46%' },
    { format: '320kbps MP3 Audio', share: '28%' },
    { format: '720p MP4 Video', share: '16%' },
    { format: '128kbps MP3 Audio', share: '10%' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Traffic & Analytics Overview</h2>
        <p className="text-xs text-slate-400 mt-1">Platform popularity, media format preferences, and system bandwidth distribution.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Platform Share */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-purple" />
              Platform Distribution
            </h3>
            <Badge variant="primary" size="sm">Past 30 Days</Badge>
          </div>

          <div className="space-y-3">
            {platformBreakdown.map((item) => (
              <div key={item.platform} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-white">{item.platform}</span>
                  <span className="text-slate-400">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Format Share */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <HardDriveDownload className="w-4 h-4 text-brand-cyan" />
              Popular Conversion Formats
            </h3>
            <Badge variant="cyan" size="sm">Muxed Outputs</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            {formatBreakdown.map((fmt) => (
              <div key={fmt.format} className="p-4 rounded-xl bg-dark-900/80 border border-white/5 space-y-1 text-center">
                <p className="text-xl font-bold text-white">{fmt.share}</p>
                <p className="text-xs text-slate-400">{fmt.format}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
