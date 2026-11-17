import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Banknote, 
  Calendar, 
  ExternalLink, 
  Bookmark, 
  Wand2, 
  Check, 
  Sparkles,
  Layers
} from 'lucide-react';
import { Job } from '../types';
import { MatchBadge } from './MatchBadge';
import { api } from '../services/api';

interface JobCardProps {
  job: Job;
  onViewDetails: (job: Job) => void;
  onTailorResume: (job: Job) => void;
  isSaved?: boolean;
  onToggleSave?: (job: Job, saved: boolean) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onViewDetails,
  onTailorResume,
  isSaved = false,
  onToggleSave,
}) => {
  const [saved, setSaved] = useState(isSaved);
  const [saving, setSaving] = useState(false);

  const formatSalary = (min?: number, max?: number, currency = 'USD') => {
    if (!min && !max) return null;
    const currSym = currency === 'INR' ? '₹' : '$';
    if (min && max) {
      if (currency === 'INR') {
        return `${currSym}${(min / 100000).toFixed(1)}L - ${currSym}${(max / 100000).toFixed(1)}L`;
      }
      return `${currSym}${(min / 1000).toFixed(0)}k - ${currSym}${(max / 1000).toFixed(0)}k`;
    }
    const val = min || max;
    return val ? `${currSym}${val.toLocaleString()}` : null;
  };

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaving(true);
    const nextSaved = !saved;
    setSaved(nextSaved);
    try {
      if (nextSaved) {
        await api.createApplication({ job_id: job.id, status: 'saved' });
      }
      if (onToggleSave) onToggleSave(job, nextSaved);
    } catch (err) {
      setSaved(!nextSaved);
    } finally {
      setSaving(false);
    }
  };

  const salaryStr = formatSalary(job.min_salary, job.max_salary, job.salary_currency);
  const matchScore = job.match?.overall_score ?? 75;
  const matchingSkills = job.match?.matching_skills ?? job.extracted_skills?.slice(0, 3) ?? [];
  const missingSkills = job.match?.missing_required_skills ?? [];

  return (
    <div 
      onClick={() => onViewDetails(job)}
      className="group relative bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
    >
      <div>
        {/* Top Header: Company & Match Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-sm font-bold text-white shadow-inner">
              {job.company.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300 hover:text-white transition-colors">
                  {job.company}
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                  {job.source}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                {job.title}
              </h3>
            </div>
          </div>

          <MatchBadge score={matchScore} size="sm" showLabel={false} />
        </div>

        {/* Location & Metadata Pill Bar */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400 mb-3.5">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span className="line-clamp-1">{job.location}</span>
          </div>

          <span className="w-1 h-1 rounded-full bg-slate-700" />

          <span className={`capitalize px-2 py-0.5 rounded-full text-[11px] font-medium ${
            job.work_arrangement === 'remote'
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
              : job.work_arrangement === 'hybrid'
              ? 'bg-blue-950/60 text-blue-400 border border-blue-800/40'
              : 'bg-slate-800 text-slate-400'
          }`}>
            {job.work_arrangement}
          </span>

          {salaryStr && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <div className="flex items-center gap-1 text-slate-300 font-mono">
                <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                <span>{salaryStr}</span>
              </div>
            </>
          )}
        </div>

        {/* Skills Tag Area */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {matchingSkills.slice(0, 4).map((skill, idx) => (
            <span 
              key={idx}
              className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium"
            >
              ✓ {skill}
            </span>
          ))}

          {missingSkills.slice(0, 2).map((skill, idx) => (
            <span 
              key={idx}
              className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20"
              title="Skill missing from master resume"
            >
              + {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-2">
          {/* Tailor Resume (Primary Action) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTailorResume(job);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm active:scale-95"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Tailor Resume</span>
          </button>

          {/* Direct Apply link */}
          {job.application_url && (
            <a
              href={job.application_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Open original job posting"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Save Bookmark */}
        <button
          onClick={handleSaveToggle}
          disabled={saving}
          className={`p-1.5 rounded-xl border transition-colors ${
            saved 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800'
          }`}
          title={saved ? 'Job saved' : 'Save job'}
        >
          <Bookmark className={`w-4 h-4 ${saved ? 'fill-emerald-400' : ''}`} />
        </button>
      </div>
    </div>
  );
};
