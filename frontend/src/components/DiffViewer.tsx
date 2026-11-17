import React from 'react';
import { 
  Check, 
  X, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Info,
  Clock
} from 'lucide-react';
import { DiffItem } from '../types';

interface DiffViewerProps {
  diffs: DiffItem[];
  onDecision: (diffId: string, decision: 'accepted' | 'rejected') => void;
  onAcceptAll?: () => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diffs, onDecision, onAcceptAll }) => {
  if (diffs.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
        <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-white">Resume Fully Optimized</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          Your existing master resume already directly addresses this job's requirements without requiring modification.
        </p>
      </div>
    );
  }

  const pendingCount = diffs.filter(d => d.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Top Guarantee & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-800/30">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs text-emerald-300 font-medium">
            Zero-Hallucination Contract: All proposals rephrase verified accomplishments only.
          </span>
        </div>

        {pendingCount > 0 && onAcceptAll && (
          <button
            onClick={onAcceptAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm self-start sm:self-auto"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept All ({pendingCount})</span>
          </button>
        )}
      </div>

      {/* Diff Cards List */}
      <div className="space-y-3">
        {diffs.map((diff) => {
          const isPending = diff.status === 'pending';
          const isAccepted = diff.status === 'accepted';
          const isRejected = diff.status === 'rejected';

          return (
            <div 
              key={diff.id}
              className={`p-4 rounded-2xl border transition-all ${
                isAccepted 
                  ? 'bg-slate-900/40 border-emerald-900/40' 
                  : isRejected 
                  ? 'bg-slate-950/40 border-slate-800/40 opacity-60' 
                  : 'bg-slate-900/80 border-slate-800 shadow-sm'
              }`}
            >
              {/* Header: Section & Status */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    {diff.section}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                    Keyword: {diff.matched_keyword}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isAccepted && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Check className="w-3 h-3" /> Accepted
                    </span>
                  )}
                  {isRejected && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                      <X className="w-3 h-3" /> Kept Original
                    </span>
                  )}
                  {isPending && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <Clock className="w-3 h-3" /> Needs Review
                    </span>
                  )}
                </div>
              </div>

              {/* Side-by-side or stacked diff comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-xs">
                {/* Original */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold block mb-1">
                    Master Resume (Original)
                  </span>
                  <p className="text-slate-300 leading-relaxed">{diff.original}</p>
                </div>

                {/* Proposed */}
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-semibold block mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Tailored Proposal
                  </span>
                  <p className="text-emerald-200 leading-relaxed font-medium">{diff.proposed}</p>
                </div>
              </div>

              {/* Reason & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{diff.reason}</span>
                </div>

                {/* Decision Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => onDecision(diff.id, 'rejected')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      isRejected 
                        ? 'bg-slate-800 text-white border-slate-700' 
                        : 'text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Keep Original
                  </button>

                  <button
                    onClick={() => onDecision(diff.id, 'accepted')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isAccepted 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isAccepted ? 'Accepted' : 'Accept Change'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
