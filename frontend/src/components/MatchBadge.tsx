import React from 'react';
import { Sparkles } from 'lucide-react';

interface MatchBadgeProps {
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const MatchBadge: React.FC<MatchBadgeProps> = ({ 
  score = 75, 
  size = 'md',
  showLabel = true 
}) => {
  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));

  let colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
  let badgeText = 'Strong Match';
  
  if (boundedScore < 60) {
    colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
    badgeText = 'Moderate Match';
  } else if (boundedScore < 75) {
    colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/25';
    badgeText = 'Good Match';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  }[size];

  return (
    <div className={`inline-flex items-center font-mono font-medium rounded-full border ${colorClasses} ${sizeClasses}`}>
      <Sparkles className="w-3 h-3" />
      <span>{boundedScore}%</span>
      {showLabel && <span className="opacity-80 font-sans font-normal text-[11px]">• {badgeText}</span>}
    </div>
  );
};
