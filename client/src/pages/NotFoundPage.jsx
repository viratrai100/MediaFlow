import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md text-center space-y-6 p-8">
        <div className="w-16 h-16 rounded-2xl bg-brand-purple/10 text-brand-purple border border-brand-purple/30 mx-auto flex items-center justify-center">
          <HelpCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-white">404 - Page Not Found</h2>
          <p className="text-xs text-slate-400">
            The requested resource or route does not exist.
          </p>
        </div>
        <Link to="/">
          <Button variant="primary" size="md" icon={ArrowLeft}>
            Return to Downloader
          </Button>
        </Link>
      </Card>
    </div>
  );
}
