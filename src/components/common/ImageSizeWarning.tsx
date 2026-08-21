import React from 'react';
import { AlertCircle, Zap } from 'lucide-react';

interface ImageSizeWarningProps {
  fileSize?: number; // in bytes
}

export const ImageSizeWarning: React.FC<ImageSizeWarningProps> = ({ fileSize }) => {
  if (!fileSize) return null;

  const isLarge = fileSize > 1 * 1024 * 1024; // > 1MB
  const sizeMb = (fileSize / (1024 * 1024)).toFixed(2);

  if (!isLarge) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
        <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Optimal file size ({sizeMb}MB). Ready for lightning-fast loading!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-medium bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 animate-in fade-in duration-150">
      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
      <div>
        <span className="font-bold">Large image ({sizeMb}MB).</span>{' '}
        <span className="text-amber-800 font-semibold">Recommend &lt;1MB</span> for faster storefront loading.
      </div>
    </div>
  );
};
