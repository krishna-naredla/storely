import React from 'react';
import { Plus } from 'lucide-react';

interface DashboardEmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="py-16 text-center bg-[var(--card)] rounded-[var(--r16)] border border-dashed border-[var(--border)] p-8 space-y-4 shadow-[var(--shadow-xs)]">
      <div className="w-16 h-16 rounded-[var(--r12)] bg-[var(--g100)] text-[var(--g700)] flex items-center justify-center mx-auto border border-[var(--g200)]">
        <Icon className="w-8 h-8" />
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-base font-bold text-[var(--t1)] font-heading">{title}</h3>
        <p className="text-xs text-[var(--t2)] leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="ds-btn-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer mt-2 shadow-[var(--shadow-xs)]"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
