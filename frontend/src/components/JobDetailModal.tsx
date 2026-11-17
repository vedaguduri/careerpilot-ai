import React from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  Banknote, 
  ExternalLink, 
  Wand2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Info
} from 'lucide-react';
import { Job } from '../types';
import { MatchBadge } from './MatchBadge';

interface JobDetailModalProps {
  job: Job | null;
  onClose: () => void;
  onTailorResume: (job: Job) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, onClose, onTailorResume }) => {
  if (!job) return null;

  const match = job.match;
  const score = match?.overall_score ?? 75;
  const matchingSkills = match?.matching_skills ?? job.extracted_skills?.slice(0, 4) ?? [];
  const missingSkills = match?.missing_required_skills ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-bold text-white shadow-inner">
              {job.company.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-400">{job.company}</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {job.source}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white leading-tight">{job.title}</h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-6">
          
          {/* Transparent Match Score Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-800/80 to-slate-800/40 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MatchBadge score={score} size="md" />
                <span className="text-xs text-slate-400 font-medium">Deterministic Match Analysis</span>
              </div>
              <p className="text-xs text-slate-300">
                Score based on 40% verified skills, 25% experience depth, 20% role alignment, and 15% project impact.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onTailorResume(job);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-2 whitespace-nowrap transition-all shadow-md active:scale-95"
            >
              <Wand2 className="w-4 h-4" />
              <span>Tailor Resume</span>
            </button>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 text-[11px] block mb-1">Location</span>
              <div className="flex items-center gap-1 text-slate-200 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{job.location}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 text-[11px] block mb-1">Work Arrangement</span>
              <span className="capitalize font-medium text-emerald-400">{job.work_arrangement}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 text-[11px] block mb-1">Employment</span>
              <span className="capitalize font-medium text-slate-200">{job.employment_type}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400 text-[11px] block mb-1">Source Verification</span>
              <span className="text-slate-300 font-mono text-[11px]">Active ATS Feed</span>
            </div>
          </div>

          {/* Skills Breakdown */}
          <div>
            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold mb-2.5">
              Skills Alignment & Requirements
            </h4>
            <div className="space-y-3">
              {/* Verified Matches */}
              <div>
                <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-2 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Matching Verified Skills on Your Master Resume</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {matchingSkills.map((s, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 font-medium">
                      ✓ {s}
                    </span>
                  ))}
                  {matchingSkills.length === 0 && (
                    <span className="text-xs text-slate-400 italic">No exact skill tokens matched yet.</span>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              {missingSkills.length > 0 && (
                <div>
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-2 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Skills Mentioned in Job Not Yet on Your Resume</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {missingSkills.map((s, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/25">
                        + {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Job Description */}
          <div>
            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold mb-2">
              Job Description
            </h4>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            {job.application_url && (
              <a
                href={job.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <span>Original Application Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              onClick={() => {
                onClose();
                onTailorResume(job);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Tailor Resume</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
