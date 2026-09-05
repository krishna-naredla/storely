import React from 'react';

export const DashboardSkeleton = ({ count = 3, type = 'card' }: { count?: number, type?: 'card' | 'list' }) => {
  return (
    <div className={`grid gap-4 ${type === 'card' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-3xl border border-slate-200 p-4 flex flex-col gap-3 relative animate-pulse shadow-xs"
        >
          {type === 'card' && <div className="h-40 sm:h-48 bg-slate-100 rounded-2xl w-full" />}
          <div className="space-y-2 pt-2">
            <div className="h-5 bg-slate-100 rounded-md w-3/4" />
            <div className="h-3 bg-slate-100 rounded-md w-1/2" />
          </div>
          <div className="flex items-center justify-between pt-4 mt-auto border-t border-slate-50">
            <div className="h-6 bg-slate-100 rounded-lg w-1/3" />
            <div className="h-8 bg-slate-100 rounded-xl w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
};
