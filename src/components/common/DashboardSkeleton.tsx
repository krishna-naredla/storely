import React from 'react';

export const DashboardSkeleton = ({ count = 3, type = 'card' }: { count?: number, type?: 'card' | 'list' }) => {
  return (
    <div className={`grid gap-4 ${type === 'card' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--card)] rounded-[var(--r16)] border border-[var(--border)] p-4 flex flex-col gap-3 relative animate-pulse shadow-[var(--shadow-xs)]"
        >
          {type === 'card' && <div className="h-40 sm:h-48 bg-[var(--bg)] rounded-[var(--r12)] w-full" />}
          <div className="space-y-2 pt-2">
            <div className="h-5 bg-[var(--bg)] rounded-[var(--r8)] w-3/4" />
            <div className="h-3 bg-[var(--bg)] rounded-[var(--r8)] w-1/2" />
          </div>
          <div className="flex items-center justify-between pt-4 mt-auto border-t border-[var(--border)]">
            <div className="h-6 bg-[var(--bg)] rounded-[var(--r8)] w-1/3" />
            <div className="h-8 bg-[var(--bg)] rounded-[var(--r8)] w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
};
