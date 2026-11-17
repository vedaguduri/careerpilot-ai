import React, { useState, useEffect } from 'react';
import { 
  Wand2, 
  ArrowLeft, 
  Download, 
  FileCode, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink,
  RefreshCw,
  Building2,
  MapPin,
  Sparkles
} from 'lucide-react';
import { Job, TailoredResume } from '../types';
import { DiffViewer } from '../components/DiffViewer';
import { api } from '../services/api';

interface TailorResumeProps {
  job: Job;
  onBack: () => void;
  onNavigateToApplications?: () => void;
}

export const TailorResume: React.FC<TailorResumeProps> = ({ job, onBack, onNavigateToApplications }) => {
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null);
  const [activeView, setActiveView] = useState<'diffs' | 'preview' | 'latex'>('diffs');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [appliedToTracker, setAppliedToTracker] = useState(false);

  useEffect(() => {
    const loadTailored = async () => {
      setIsLoading(true);
      try {
        const res = await api.generateTailoredResume(job.id);
        setTailoredResume(res);
      } catch (err) {
        console.error('Failed to generate tailored resume:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTailored();
  }, [job.id]);

  const handleDiffDecision = async (diffId: string, decision: 'accepted' | 'rejected') => {
    if (!tailoredResume) return;
    setIsUpdating(true);
    try {
      const updated = await api.decideDiff(tailoredResume.id, diffId, decision);
      setTailoredResume(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAcceptAll = async () => {
    if (!tailoredResume) return;
    for (const d of tailoredResume.diff_summary) {
      if (d.status === 'pending') {
        await handleDiffDecision(d.id, 'accepted');
      }
    }
  };

  const handleTrackApplication = async () => {
    if (!tailoredResume) return;
    try {
      await api.createApplication({
        job_id: job.id,
        status: 'preparing',
        tailored_resume_id: tailoredResume.id,
        notes: `Tailored resume generated targeting ${job.title}.`
      });
      setAppliedToTracker(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center space-y-4">
        <Wand2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
        <h3 className="text-lg font-bold text-white">Analyzing Job Requirements & Master Resume...</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Extracting ATS keywords, aligning verified accomplishments, and preparing side-by-side truthful diff proposals.
        </p>
      </div>
    );
  }

  if (!tailoredResume) {
    return (
      <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 space-y-3">
        <h3 className="text-base font-semibold text-white">Could not generate tailored resume</h3>
        <p className="text-xs text-slate-400">Make sure your master resume is uploaded and configured first.</p>
        <button onClick={onBack} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs">
          Go Back
        </button>
      </div>
    );
  }

  const acceptedDiffsCount = tailoredResume.diff_summary.filter(d => d.status === 'accepted').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400">{job.company}</span>
              <span className="text-[10px] text-slate-400 font-mono">• {job.location}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">
              Resume Tailoring Studio: {job.title}
            </h1>
          </div>
        </div>

        {/* View Switcher & Downloads */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-view tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveView('diffs')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeView === 'diffs' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Diff Verification ({acceptedDiffsCount}/{tailoredResume.diff_summary.length})
            </button>
            <button
              onClick={() => setActiveView('preview')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeView === 'preview' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Document Preview
            </button>
            <button
              onClick={() => setActiveView('latex')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeView === 'latex' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              LaTeX Source
            </button>
          </div>

          {/* Download Buttons */}
          <a
            href={`/api/tailoring/${tailoredResume.id}/download/pdf`}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </a>

          <a
            href={`/api/tailoring/${tailoredResume.id}/download/tex`}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>.tex</span>
          </a>
        </div>
      </div>

      {/* Main Studio Area */}
      {activeView === 'diffs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Job Context & Target Keywords */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 h-fit">
            <h3 className="text-xs uppercase font-mono tracking-wider font-semibold text-slate-400">
              Target Job Requirements
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Company & Role:</span>
                <p className="text-sm font-bold text-white">{job.title}</p>
                <p className="text-xs text-slate-300">{job.company} • {job.location}</p>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Extracted ATS Keywords:</span>
                <div className="flex flex-wrap gap-1.5">
                  {job.extracted_skills?.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {job.application_url && (
                <div className="pt-2">
                  <a
                    href={job.application_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    <span>View original job posting</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Action: Add to Application Tracker */}
              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={handleTrackApplication}
                  disabled={appliedToTracker}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                    appliedToTracker 
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  {appliedToTracker ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Tracking in 'Preparing' Stage</span>
                    </>
                  ) : (
                    <span>Add to Application Pipeline</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Diff Review & Decision Stream */}
          <div className="lg:col-span-2 space-y-4">
            <DiffViewer
              diffs={tailoredResume.diff_summary}
              onDecision={handleDiffDecision}
              onAcceptAll={handleAcceptAll}
            />
          </div>

        </div>
      )}

      {/* Document Preview View */}
      {activeView === 'preview' && (
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 max-w-4xl mx-auto shadow-xl">
          <div className="border-b border-slate-800 pb-4 text-center">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {tailoredResume.tailored_structured_data.contact?.name || 'Candidate Name'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {[
                tailoredResume.tailored_structured_data.contact?.email,
                tailoredResume.tailored_structured_data.contact?.phone,
                tailoredResume.tailored_structured_data.contact?.location,
                tailoredResume.tailored_structured_data.contact?.linkedin
              ].filter(Boolean).join(' • ')}
            </p>
          </div>

          {/* Summary */}
          <div>
            <h4 className="text-xs uppercase font-mono tracking-wider font-bold text-emerald-400 mb-2 border-b border-slate-800 pb-1">
              Professional Summary
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {tailoredResume.tailored_structured_data.professional_summary}
            </p>
          </div>

          {/* Skills */}
          <div>
            <h4 className="text-xs uppercase font-mono tracking-wider font-bold text-emerald-400 mb-2 border-b border-slate-800 pb-1">
              Technical Skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {tailoredResume.tailored_structured_data.skills?.map((s, i) => (
                <span key={i} className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Work Experience */}
          <div>
            <h4 className="text-xs uppercase font-mono tracking-wider font-bold text-emerald-400 mb-3 border-b border-slate-800 pb-1">
              Work Experience
            </h4>
            <div className="space-y-4">
              {tailoredResume.tailored_structured_data.work_experience?.map((exp, i) => (
                <div key={i} className="text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-white">
                    <span>{exp.role} — <span className="text-slate-300">{exp.company}</span></span>
                    <span className="text-slate-400 font-mono text-[11px]">{exp.start_date} – {exp.end_date}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                    {exp.highlights?.map((h, j) => (
                      <li key={j} className="leading-relaxed">{h}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LaTeX Source View */}
      {activeView === 'latex' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-semibold text-slate-400">Deterministic LaTeX Source Code</h3>
            <span className="text-[11px] font-mono text-emerald-400">Validated ATS Modern Template</span>
          </div>
          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-[600px] leading-relaxed">
            {tailoredResume.latex_source}
          </pre>
        </div>
      )}

    </div>
  );
};
