import React from 'react';
import { HelpCircle, ShieldCheck, AlertTriangle, FileText } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';

export default function FAQPage() {
  const faqs = [
    {
      q: 'Which media URLs are permitted on this platform?',
      a: 'Only publicly accessible video and audio URLs from supported social media platforms (such as YouTube, TikTok, Instagram public reels, X/Twitter, and Vimeo) are permitted. Private profiles and paywalled content are not supported.'
    },
    {
      q: 'Does this platform bypass DRM or private account security?',
      a: 'No. SocialStream strictly respects digital rights management (DRM) and account privacy boundaries. Any media protected by Widevine, FairPlay, or login authentication will be rejected by design.'
    },
    {
      q: 'Why is the backend implemented without Python?',
      a: 'Node.js provides exceptional non-blocking I/O and native streaming pipelines (stream.pipeline) that enable zero-copy binary streaming directly to HTTP responses with lower memory overhead and simpler deployment.'
    },
    {
      q: 'What is the maximum allowed download duration or file size?',
      a: 'For guest users, requests are subject to standard rate limits (30 requests per 15 minutes) and a maximum stream duration of 30 minutes to ensure equitable bandwidth distribution.'
    },
    {
      q: 'Are downloaded videos stored permanently on the server?',
      a: 'No. The system streams media chunks in real time. In cases where temporary multiplexing is required, files are stored temporarily in a scratch directory and purged automatically upon transfer.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="text-center space-y-3">
        <Badge variant="cyan" size="md">
          Help & Compliance
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Frequently Asked Questions & <br />
          <span className="text-gradient">Usage Guidelines</span>
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Clear answers regarding platform policies, authorized workflows, copyright compliance, and streaming specifications.
        </p>
      </div>

      {/* Compliance Policy Card */}
      <Card variant="gradient" className="space-y-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-semibold text-white">Authorized Media Policy</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          SocialStream is designed for creators, researchers, and users downloading content they own or content distributed under Creative Commons licenses. Please ensure you possess the required authorization prior to downloading copyrighted works.
        </p>
      </Card>

      {/* FAQ Accordion List */}
      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <Card key={idx} className="space-y-2">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-purple/20 text-brand-purple text-xs flex items-center justify-center font-mono">
                {idx + 1}
              </span>
              {faq.q}
            </h4>
            <p className="text-xs text-slate-400 pl-7 leading-relaxed">
              {faq.a}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
