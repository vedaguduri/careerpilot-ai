import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Filter, 
  Plus, 
  Sparkles, 
  SlidersHorizontal, 
  Check, 
  X,
  Building2,
  Globe
} from 'lucide-react';
import { Job } from '../types';
import { JobCard } from '../components/JobCard';
import { api } from '../services/api';

interface FindJobsProps {
  onViewJob: (job: Job) => void;
  onTailorResume: (job: Job) => void;
}

export const FindJobs: React.FC<FindJobsProps> = ({ onViewJob, onTailorResume }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [workArrangement, setWorkArrangement] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [minScore, setMinScore] = useState<number>(0);

  // Manual Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTitle, setImportTitle] = useState('');
  const [importCompany, setImportCompany] = useState('');
  const [importLocation, setImportLocation] = useState('Remote');
  const [importUrl, setImportUrl] = useState('');
  const [importDesc, setImportDesc] = useState('');
  const [importing, setImporting] = useState(false);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchQuery) params.q = searchQuery;
      if (locationQuery) params.location = locationQuery;
      if (workArrangement !== 'all') params.work_arrangement = workArrangement;
      if (selectedSource !== 'all') params.source = selectedSource;
      if (selectedCountry !== 'all') params.country = selectedCountry;
      if (minScore > 0) params.min_score = minScore.toString();

      const results = await api.searchJobs(params);
      setJobs(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, locationQuery, workArrangement, selectedSource, selectedCountry, minScore]);

  const handleManualImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTitle || !importCompany || !importDesc) return;
    setImporting(true);
    try {
      const newJob = await api.manualImportJob({
        title: importTitle,
        company: importCompany,
        location: importLocation,
        application_url: importUrl,
        description: importDesc
      });
      setShowImportModal(false);
      setImportTitle('');
      setImportCompany('');
      setImportDesc('');
      setImportUrl('');
      fetchJobs();
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Search & Actions Bar */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          {/* Query Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role, company, or keywords (e.g. Senior Backend, Stripe, Python)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition-colors"
            />
          </div>

          {/* Location Search */}
          <div className="relative w-full md:w-64">
            <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder="Location (e.g. Bengaluru, Remote)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition-colors"
            />
          </div>

          {/* Manual Import Button */}
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors whitespace-nowrap active:scale-95"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Import Job Link / Text</span>
          </button>
        </div>

        {/* Facet Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
          
          {/* Work Arrangement */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 px-2 font-medium">Arrangement:</span>
            {['all', 'remote', 'hybrid', 'onsite'].map((type) => (
              <button
                key={type}
                onClick={() => setWorkArrangement(type)}
                className={`capitalize px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  workArrangement === type ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Region / Country */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 px-2 font-medium">Region:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'India', label: 'India' },
              { id: 'United States', label: 'US' },
              { id: 'Global', label: 'Global' }
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCountry(c.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedCountry === c.id ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Source Board */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 px-2 font-medium">Source:</span>
            {['all', 'greenhouse', 'ashby', 'lever', 'manual_import'].map((src) => (
              <button
                key={src}
                onClick={() => setSelectedSource(src)}
                className={`capitalize px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  selectedSource === src ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {src === 'manual_import' ? 'Manual' : src}
              </button>
            ))}
          </div>

          {/* Minimum Match Score */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[11px] text-slate-400">Min Match:</span>
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs rounded-xl px-2.5 py-1 focus:outline-none"
            >
              <option value={0}>Any score</option>
              <option value={60}>60%+ Match</option>
              <option value={75}>75%+ Match</option>
              <option value={85}>85%+ Strong Match</option>
            </select>
          </div>

        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Found <strong className="text-white font-mono">{jobs.length}</strong> verified opportunities</span>
      </div>

      {/* Job Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-900/40 border border-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800">
          <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No opportunities matched your filters</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, location, or import a specific job posting directly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onViewDetails={onViewJob}
              onTailorResume={onTailorResume}
            />
          ))}
        </div>
      )}

      {/* Manual Job Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Import Job Opportunity</span>
              </h3>
              <button 
                onClick={() => setShowImportModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualImportSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Job Title *</label>
                <input
                  type="text"
                  required
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  placeholder="e.g. Lead Distributed Systems Engineer"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Company *</label>
                  <input
                    type="text"
                    required
                    value={importCompany}
                    onChange={(e) => setImportCompany(e.target.value)}
                    placeholder="e.g. OpenAI"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Location</label>
                  <input
                    type="text"
                    value={importLocation}
                    onChange={(e) => setImportLocation(e.target.value)}
                    placeholder="e.g. Remote / Bengaluru"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Application URL (Optional)</label>
                <input
                  type="url"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://company.com/jobs/role-id"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-medium">Job Description / Requirements *</label>
                <textarea
                  required
                  rows={4}
                  value={importDesc}
                  onChange={(e) => setImportDesc(e.target.value)}
                  placeholder="Paste the full job description, required skills, and responsibilities..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-4 py-2 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-50"
                >
                  {importing ? 'Importing & Analyzing...' : 'Import & Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
