import React from 'react';

export function Logo({ className = '', iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#5B6CFF" />
            <stop offset="100%" stopColor="#8A46FF" />
          </linearGradient>
        </defs>
        
        {/* Circuit Nodes */}
        <path d="M15 35 H28" stroke="url(#logo-gradient)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="11" cy="35" r="3.5" fill="url(#logo-gradient)" />
        
        <path d="M10 50 H28" stroke="url(#logo-gradient)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="6" cy="50" r="3.5" fill="url(#logo-gradient)" />
        
        <path d="M15 65 H28" stroke="url(#logo-gradient)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="11" cy="65" r="3.5" fill="url(#logo-gradient)" />

        {/* Document Body */}
        <path
          d="M32 20 H68 L82 34 V80 C82 84.4 78.4 88 74 88 H32 C27.6 88 24 84.4 24 80 V28 C24 23.6 27.6 20 32 20 Z"
          fill="none"
          stroke="url(#logo-gradient)"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        {/* Folded corner */}
        <path d="M68 20 V34 H82" stroke="url(#logo-gradient)" strokeWidth="6" strokeLinejoin="round" fill="none" />
        
        {/* Document lines */}
        <path d="M38 38 H58" stroke="url(#logo-gradient)" strokeWidth="5" strokeLinecap="round" />
        <path d="M38 48 H58" stroke="url(#logo-gradient)" strokeWidth="5" strokeLinecap="round" />
        <path d="M38 58 H48" stroke="url(#logo-gradient)" strokeWidth="5" strokeLinecap="round" />

        {/* Magnifying Glass Overlay */}
        <circle
          cx="68"
          cy="68"
          r="17"
          fill="#FFFFFF"
          stroke="url(#logo-gradient)"
          strokeWidth="5"
          className="dark:fill-slate-900"
        />
        <path
          d="M80 80 L91 91"
          stroke="url(#logo-gradient)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <text
          x="68"
          y="74"
          fill="url(#logo-gradient)"
          fontSize="17"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="Inter, system-ui, sans-serif"
        >
          PL
        </text>
      </svg>

      {!iconOnly && (
        <span className="font-bold text-[16px] tracking-tight whitespace-nowrap">
          <span className="text-slate-900 dark:text-white">Paper </span>
          <span className="text-brand-500 font-extrabold">Lens</span>
        </span>
      )}
    </div>
  );
}
