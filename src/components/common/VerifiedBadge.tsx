import React from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface VerifiedBadgeProps {
  verified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  verified = true,
  size = 'sm',
  showLabel = true,
  className = '',
}) => {
  if (!verified) return null;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase tracking-wider shadow-xs select-none ${sizeClasses[size]} ${className}`}
      title="Verified Business - Profile Complete & Contact Verified"
    >
      <CheckCircle2 className={`${iconSizes[size]} text-emerald-600 shrink-0`} />
      {showLabel && <span>Verified Business</span>}
    </span>
  );
};
