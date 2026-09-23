import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Package, User } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: 'avatar' | 'banner' | 'product' | 'none';
  containerClassName?: string;
  showSkeleton?: boolean;
}

export const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  alt, 
  fallbackType = 'product',
  containerClassName = '',
  className = '',
  loading = 'lazy',
  showSkeleton = true,
  onLoad,
  onError,
  ...props 
}) => {
  const [error, setError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setError(false);
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src]);
  
  if (!src || error) {
    if (fallbackType === 'none') return null;
    return (
      <div 
        className={`bg-gradient-to-br from-slate-100 to-slate-200/80 flex items-center justify-center text-slate-400 select-none overflow-hidden ${className} ${containerClassName}`}
        role="img"
        aria-label={alt || 'Fallback placeholder'}
      >
        {fallbackType === 'avatar' && <User className="w-1/2 h-1/2 opacity-50 stroke-[1.5] text-slate-500" />}
        {fallbackType === 'product' && <Package className="w-1/2 h-1/2 opacity-50 stroke-[1.5] text-slate-500" />}
        {fallbackType === 'banner' && <ImageIcon className="w-1/4 h-1/4 opacity-40 stroke-[1.5] text-slate-400" />}
      </div>
    );
  }

  const defaultObjectFit = (!className.includes('object-') && (fallbackType === 'product' || fallbackType === 'avatar'))
    ? 'object-contain object-center'
    : '';

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {!isLoaded && showSkeleton && (
        <div className={`absolute inset-0 bg-slate-100 flex items-center justify-center text-slate-300 ${className}`}>
           {fallbackType === 'avatar' && <User className="w-1/3 h-1/3 opacity-30 text-slate-400" />}
           {fallbackType === 'product' && <Package className="w-1/3 h-1/3 opacity-30 text-slate-400" />}
           {fallbackType === 'banner' && <ImageIcon className="w-1/6 h-1/6 opacity-30 text-slate-400" />}
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt || ''}
        loading={loading}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={(e) => {
          setIsLoaded(true);
          if (onLoad) onLoad(e);
        }}
        onError={(e) => {
          setError(true);
          if (onError) onError(e);
        }}
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${defaultObjectFit} ${className}`}
        {...props}
      />
    </div>
  );
};
