import React from 'react';

interface PortfolioEmptyIllustrationProps {
  className?: string;
}

export const PortfolioEmptyIllustration: React.FC<PortfolioEmptyIllustrationProps> = ({
  className = 'w-64 h-52',
}) => {
  return (
    <svg
      viewBox="0 0 320 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Add Portfolio Item Illustration"
    >
      <defs>
        {/* Soft Background Glow */}
        <radialGradient id="pe-glow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0" />
        </radialGradient>

        {/* Card Gradient */}
        <linearGradient id="pe-card-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>

        {/* Primary Accent Gradient */}
        <linearGradient id="pe-accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>

        {/* Mountain Gradient */}
        <linearGradient id="pe-mountain" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.8" />
        </linearGradient>

        {/* Sun Gradient */}
        <linearGradient id="pe-sun" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>

        {/* Subtle drop shadow filter */}
        <filter id="pe-shadow" x="-10%" y="-10%" width="125%" height="130%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.08" />
        </filter>
        <filter id="pe-shadow-sm" x="-10%" y="-10%" width="125%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#4f46e5" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Radial ambient glow */}
      <circle cx="160" cy="115" r="110" fill="url(#pe-glow)" />

      {/* Dashed placeholder backdrop board */}
      <rect
        x="36"
        y="30"
        width="248"
        height="164"
        rx="24"
        fill="#f8fafc"
        stroke="#cbd5e1"
        strokeWidth="2"
        strokeDasharray="6 6"
      />

      {/* Background Project Card (Rotated slightly left) */}
      <g transform="rotate(-6 110 110)" filter="url(#pe-shadow)">
        <rect
          x="55"
          y="50"
          width="115"
          height="120"
          rx="18"
          fill="url(#pe-card-grad)"
          stroke="#e2e8f0"
          strokeWidth="1.5"
        />
        {/* Placeholder image wireframe */}
        <rect x="65" y="60" width="95" height="58" rx="12" fill="#e0e7ff" />
        <circle cx="85" cy="78" r="7" fill="url(#pe-sun)" />
        <path
          d="M68 112L85 92L105 112H68Z"
          fill="#a5b4fc"
        />
        <path
          d="M95 112L115 88L145 112H95Z"
          fill="#818cf8"
        />
        {/* Text lines */}
        <rect x="65" y="128" width="60" height="7" rx="3.5" fill="#94a3b8" />
        <rect x="65" y="142" width="40" height="6" rx="3" fill="#cbd5e1" />
      </g>

      {/* Main Foreground Project Card (Elevated center) */}
      <g filter="url(#pe-shadow)">
        <rect
          x="105"
          y="42"
          width="140"
          height="146"
          rx="20"
          fill="#ffffff"
          stroke="#e2e8f0"
          strokeWidth="1.5"
        />
        {/* Artwork Canvas Frame */}
        <rect x="117" y="54" width="116" height="74" rx="14" fill="#eef2ff" />
        {/* Sun in canvas */}
        <circle cx="145" cy="74" r="9" fill="url(#pe-sun)" />
        {/* Canvas mountains */}
        <path
          d="M120 122L148 94L175 122H120Z"
          fill="#a5b4fc"
        />
        <path
          d="M160 122L188 88L225 122H160Z"
          fill="url(#pe-mountain)"
        />
        {/* Play/View Badge overlay */}
        <circle cx="175" cy="91" r="14" fill="#ffffff" filter="url(#pe-shadow-sm)" />
        <polygon points="172,84 182,91 172,98" fill="#4f46e5" />

        {/* Card Title & Tags */}
        <rect x="117" y="138" width="76" height="8" rx="4" fill="#1e293b" />
        <rect x="117" y="152" width="102" height="6" rx="3" fill="#94a3b8" />
        <rect x="117" y="165" width="42" height="12" rx="6" fill="#e0e7ff" />
        <rect x="165" y="165" width="36" height="12" rx="6" fill="#f1f5f9" />
      </g>

      {/* Floating Sparkles and Camera / Pen Tool Badge */}
      <g filter="url(#pe-shadow-sm)">
        <rect x="236" y="24" width="44" height="44" rx="14" fill="url(#pe-accent-grad)" />
        {/* Plus Symbol inside badge */}
        <path
          d="M258 38V54M250 46H266"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>

      {/* Floating Sparkle 1 */}
      <path
        d="M58 24L61 33L70 36L61 39L58 48L55 39L46 36L55 33L58 24Z"
        fill="#6366f1"
      />
      {/* Floating Sparkle 2 */}
      <path
        d="M268 184L270 190L276 192L270 194L268 200L266 194L260 192L266 190L268 184Z"
        fill="#f59e0b"
      />
      {/* Small star accent */}
      <circle cx="94" cy="28" r="3" fill="#ec4899" />
      <circle cx="282" cy="130" r="3.5" fill="#06b6d4" />
      <circle cx="48" cy="180" r="2.5" fill="#8b5cf6" />
    </svg>
  );
};
