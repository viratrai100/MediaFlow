import React from 'react';
import { HelpCircle, PlayCircle, ShieldCheck, AlertTriangle, FileText, Smartphone, Laptop, Check } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

export default function HelpPage() {
  const guides = [
    {
      platform: 'YouTube',
      steps: [
        'Open YouTube in your browser or app.',
        'Navigate to any public video or Short.',
        'Click the "Share" button and select "Copy Link".',
        'Paste the copied link into SocialStream and click "Fetch Media".'
      ]
    },
    {
      platform: 'TikTok',
      steps: [
        'Open TikTok and find the public video you want to download.',
        'Tap the "Share" arrow on the right side of the screen.',
        'Tap "Copy Link".',
        'Paste into the SocialStream search bar to get the direct MP4 stream.'
      ]
    },
    {
      platform: 'Instagram Reels',
      steps: [
        'Open Instagram and view the public Reel or post.',
        'Tap the three dots (•••) or the paper airplane Share icon.',
        'Select "Copy Link".',
        'Paste the URL into SocialStream to resolve the clean media stream.'
      ]
    },
    {
      platform: 'X / Twitter & Vimeo',
      steps: [
        'Click the share button under the public tweet or video page.',
        'Select "Copy link to Tweet" or copy the browser address bar.',
        'Paste the link into SocialStream and choose your preferred bitrate.'
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="text-center space-y-3">
        <Badge variant="cyan" size="md">
          Step-by-Step Tutorials
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          How to Download Public Media
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Detailed instructions on finding and copying public links across all supported social networks.
        </p>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {guides.map((g) => (
          <Card key={g.platform} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">{g.platform} Guide</h3>
              <Badge variant="primary" size="sm">
                Public Content
              </Badge>
            </div>

            <ol className="space-y-2.5 text-xs text-slate-300">
              {g.steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-brand-purple/20 text-brand-purple text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>

      {/* Fair Use & Restrictions Box */}
      <Card variant="gradient" className="space-y-3 p-6">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <h4 className="text-sm font-bold text-white">Important Compliance Information</h4>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Please note that SocialStream strictly enforces copyright protection and fair use guidelines. Downloading commercial works without authorization or attempting to bypass DRM mechanisms is strictly prohibited.
        </p>
      </Card>
    </div>
  );
}
