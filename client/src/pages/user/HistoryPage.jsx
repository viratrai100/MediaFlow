import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Trash2,
  Download,
  ExternalLink,
  Film,
  Music,
  Clock,
  HardDrive,
  Filter,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useDownload } from '../../context/DownloadContext';
import { apiService } from '../../services/apiService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import { Link } from 'react-router-dom';

export default function HistoryPage() {
  const { history: localHistory, setUrl, fetchMedia } = useDownload();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'video' | 'audio'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'completed' | 'failed' | 'processing'

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getJobsHistory({
        page,
        limit: 8,
        search: searchQuery,
        type: filterType,
        status: filterStatus
      });

      if (data && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
        setPagination(data.pagination || { currentPage: page, totalPages: 1, totalItems: data.jobs.length });
      } else {
        setJobs(localHistory);
      }
    } catch (e) {
      // Fallback to local history
      setJobs(localHistory);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, filterType, filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleDeleteJob = async (id) => {
    try {
      await apiService.deleteJob(id);
      setJobs((prev) => prev.filter((j) => (j._id || j.id) !== id));
    } catch (e) {
      setJobs((prev) => prev.filter((j) => (j._id || j.id) !== id));
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all download history?')) {
      try {
        await apiService.clearAllJobs();
      } catch (e) {}
      setJobs([]);
      setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 });
    }
  };

  const handleRedownload = (itemUrl) => {
    setUrl(itemUrl);
    fetchMedia(itemUrl);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-purple/20 text-brand-purple flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Download Job History</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track, re-stream, or manage previous media extraction tasks and downloads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={fetchJobs}
            isLoading={isLoading}
          >
            Refresh
          </Button>

          {jobs.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={handleClearAll}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 flex items-center gap-2">
          <Input
            icon={Search}
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-dark-800/80 p-1 rounded-xl border border-white/5">
            {['all', 'completed', 'processing', 'failed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => { setFilterStatus(st); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filterStatus === st
                    ? 'bg-brand-purple text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-dark-800/80 p-1 rounded-xl border border-white/5">
            {['all', 'video', 'audio'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => { setFilterType(type); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filterType === type
                    ? 'bg-brand-purple text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History List or Loader */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <Loader size="lg" text="Loading download job records..." />
        </Card>
      ) : jobs.length === 0 ? (
        <Card className="p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-dark-700 text-slate-400 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Download Records</h3>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery
                ? 'No download jobs match your search or filter.'
                : 'You have not enqueued or downloaded any media streams yet.'}
            </p>
          </div>
          <Link to="/">
            <Button variant="primary" size="sm" icon={Sparkles}>
              Start Downloading
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((item) => {
            const jobId = item._id || item.id;
            const isAudio = item.mediaType === 'audio' || item.type === 'audio';
            const Icon = isAudio ? Music : Film;
            const statusVariant =
              item.status === 'completed'
                ? 'success'
                : item.status === 'processing' || item.status === 'queued'
                ? 'cyan'
                : 'danger';

            return (
              <Card
                key={jobId}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-brand-purple/30 transition-all"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="p-3 rounded-xl bg-dark-700 text-brand-purple shrink-0 border border-white/5">
                    <Icon className="w-5 h-5 text-brand-cyan" />
                  </div>

                  <div className="min-w-0 space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white truncate max-w-md">
                        {item.mediaTitle || item.title || 'Untitled Stream'}
                      </h4>
                      <Badge variant={statusVariant} size="sm">
                        {item.status || 'completed'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span className="font-semibold text-brand-purple">{item.platform}</span>
                      <span>•</span>
                      <span>{item.formatId || item.format}</span>
                      <span>•</span>
                      <span>{item.container?.toUpperCase()}</span>
                      {item.fileSizeMB > 0 && (
                        <>
                          <span>•</span>
                          <span>{item.fileSizeMB} MB</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{new Date(item.createdAt || item.timestamp || Date.now()).toLocaleDateString()}</span>
                    </div>

                    {item.errorMessage && (
                      <p className="text-[10px] text-rose-400 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" /> {item.errorMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {item.status === 'completed' && (
                    <a
                      href={apiService.getJobDownloadUrl(jobId)}
                      download
                      className="inline-flex items-center"
                    >
                      <Button variant="primary" size="sm" icon={Download}>
                        Download
                      </Button>
                    </a>
                  )}

                  <Link to="/">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRedownload(item.url)}
                    >
                      Re-fetch
                    </Button>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDeleteJob(jobId)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}

          {/* Pagination Bar */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <span className="text-xs text-slate-400">
                Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total jobs)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  icon={ChevronLeft}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  icon={ChevronRight}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
