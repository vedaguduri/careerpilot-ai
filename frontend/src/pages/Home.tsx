import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Bookmark, 
  Briefcase, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Job, ApplicationRecord } from '../types';
import { JobCard } from '../components/JobCard';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface HomeProps {
  onViewJob: (job: Job) => void;
  onTailorResume: (job: Job) => void;
  onNavigate: (tab: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onViewJob, onTailorResume, onNavigate }) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'best' | 'new' | 'recent' | 'saved'>('best');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [recs, apps] = await Promise.all([
        api.getRecommendations(),
        api.getApplications()
      ]);
      setJobs(recs);
      setApplications(apps);
    } catch (err) {
      console.error('Failed to load homepage data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
  };

  // Metrics
  const strongMatchesCount = jobs.filter(j => (j.match?.overall_score || 0) >= 80).length;
  const inProgressApps = applications.filter(a => ['preparing', 'applied', 'assessment', 'interview'].includes(a.status));
  const savedJobsIds = new Set(applications.filter(a => a.status === 'saved').map(a => a.job_id));

  // Filtered jobs according to the 4 requested homepage sections
  let displayedJobs = [...jobs];
  if (activeTab === 'best') {
    displayedJobs.sort((a, b) => (b.match?.overall_score || 0) - (a.match?.overall_score || 0));
  } else if (activeTab === 'new') {
    displayedJobs.sort((a, b) => new Date(b.first_seen_at || 0).getTime() - new Date(a.first_seen_at || 0).getTime());
  } else if (activeTab === 'recent') {
    displayedJobs.sort((a, b) => new Date(b.posted_at || b.first_seen_at || 0).getTime() - new Date(a.posted_at || a.first_seen_at || 0).getTime());
  } else if (activeTab === 'saved') {
    displayedJobs = jobs.filter(j => savedJobsIds.has(j.id));
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Hero Welcome Section */}
      <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800/80 p-6 sm:p-10 overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Job Search Gateway</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2 font-sans">
            Your next opportunity starts here.
          </h1>
          <p className="text-base text-slate-300 font-normal leading-relaxed">
            We found opportunities that match your skills and career interests. Automated background discovery keeps fresh matches ready whenever you return.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">New Discoveries</span>
              <span className="text-2xl font-bold font-mono text-white">{jobs.length}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">Strong Matches</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">{strongMatchesCount}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">Saved Roles</span>
              <span className="text-2xl font-bold font-mono text-slate-200">{savedJobsIds.size}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">In Progress</span>
              <span className="text-2xl font-bold font-mono text-blue-400">{inProgressApps.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pick Up Where You Left Off (Returning User Experience) */}
      {(inProgressApps.length > 0 || savedJobsIds.size > 0) && (
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Pick up where you left off</h2>
            </div>
            <button
              onClick={() => onNavigate('applications')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>View all applications</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {inProgressApps.slice(0, 3).map((app) => (
              <div 
                key={app.id}
                onClick={() => onNavigate('applications')}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                    {app.status}
                  </span>
                  <h4 className="text-sm font-semibold text-white mt-1.5 line-clamp-1">
                    {app.job?.title || 'Applied Role'}
                  </h4>
                  <p className="text-xs text-slate-400">{app.job?.company || 'Company'}</p>
                </div>
                {app.tailored_resume && (
                  <span className="p-2 rounded-xl bg-slate-800 text-emerald-400" title="Tailored resume ready">
                    <FileText className="w-4 h-4" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Jobs Header with 4 Clear Categories */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Prepared Job Opportunities</h2>
          <p className="text-xs text-slate-400">Pre-computed matches verified against your master resume.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* 4 Clean Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('best')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'best' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Best Matches
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'new' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              New Opportunities
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'recent' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Recently Posted
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'saved' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Saved ({savedJobsIds.size})
            </button>
          </div>

          {/* Refresh Action */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh recommendations"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Job Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-900/40 border border-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : displayedJobs.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
          <Bookmark className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No jobs found in this category</h3>
          <p className="text-xs text-slate-400 mt-1">Try selecting another tab or run a multi-source sync.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSaved={savedJobsIds.has(job.id)}
              onViewDetails={onViewJob}
              onTailorResume={onTailorResume}
              onToggleSave={(j, saved) => {
                if (saved) savedJobsIds.add(j.id);
                else savedJobsIds.delete(j.id);
              }}
            />
          ))}
        </div>
      )}

    </div>
  );
};
