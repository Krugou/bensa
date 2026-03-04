import React, { useState } from 'react';

import { Analytics } from '../utils/analytics';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  headerColorClass?: string;
  storageKey?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  badge,
  children,
  defaultExpanded = true,
  className = '',
  headerColorClass = 'bg-[var(--color-fuel-green)]',
  storageKey,
}) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`section_${storageKey}`);
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return defaultExpanded;
  });

  const toggleExpanded = () => {
    const nextValue = !isExpanded;
    setIsExpanded(nextValue);
    if (storageKey) {
      localStorage.setItem(`section_${storageKey}`, String(nextValue));
      Analytics.trackSectionToggle(storageKey || title, nextValue);
    } else {
      Analytics.trackSectionToggle(title, nextValue);
    }
  };

  return (
    <section
      className={`rounded-2xl bg-slate-200/30 dark:bg-white/[0.03] backdrop-blur-xl border border-slate-300/50 dark:border-white/10 overflow-hidden transition-all duration-500 ${className}`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={toggleExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            toggleExpanded();
          }
        }}
        className="w-full flex items-center gap-4 p-6 text-left hover:bg-slate-300/20 dark:hover:bg-white/[0.02] transition-all duration-300 focus:outline-none cursor-pointer"
      >
        {icon ?? (
          <div
            className={`w-2.5 h-2.5 rounded-full ${headerColorClass} shadow-[0_0_10px_currentColor] opacity-80`}
          ></div>
        )}
        <h2 className="text-xl font-sans font-bold uppercase tracking-wider text-black dark:text-white/90">
          {title}
        </h2>
        <div className="ml-auto flex items-center gap-4">
          {badge && <div className="flex items-center cursor-default">{badge}</div>}
          <div
            className={`transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] p-1.5 rounded-lg bg-slate-300/50 dark:bg-white/5 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-600 dark:text-white/50"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      <div
        className={`transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-6 pb-6 border-t border-slate-300/50 dark:border-white/[0.06] pt-6">
          {children}
        </div>
      </div>
    </section>
  );
};
