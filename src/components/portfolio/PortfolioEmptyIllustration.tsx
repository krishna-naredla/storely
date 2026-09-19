import React from 'react';
import { FolderPlus } from 'lucide-react';

interface PortfolioEmptyIllustrationProps {
  className?: string;
}

export const PortfolioEmptyIllustration: React.FC<PortfolioEmptyIllustrationProps> = ({
  className = 'w-48 h-36',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs mb-2">
        <FolderPlus className="w-6 h-6 stroke-[1.75]" />
      </div>
      <div className="text-xs font-semibold text-slate-700">No Projects Added</div>
      <div className="text-[11px] text-slate-400 text-center mt-0.5">Showcase your best creative work &amp; case studies</div>
    </div>
  );
};
