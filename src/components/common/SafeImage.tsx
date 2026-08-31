import React, { useState } from 'react';
import { Image as ImageIcon, Package, User } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: 'avatar' | 'banner' | 'product' | 'none';
  containerClassName?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  alt, 
  fallbackType = 'product',
  containerClassName = '',
  className = '',
  ...props 
}) => {
  const [error, setError] = useState(false);
  
  if (!src || error) {
    if (fallbackType === 'none') return null;
    return (
      <div className={`bg-slate-100 flex items-center justify-center text-slate-400 ${className} ${containerClassName}`}>
        {fallbackType === 'avatar' && <User className="w-1/2 h-1/2 opacity-50" />}
        {fallbackType === 'product' && <Package className="w-1/2 h-1/2 opacity-50" />}
        {fallbackType === 'banner' && <ImageIcon className="w-1/4 h-1/4 opacity-50" />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
      {...props}
    />
  );
};
