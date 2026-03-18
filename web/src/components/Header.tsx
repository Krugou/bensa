import React from 'react';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ children }) => {
  const { t } = useTranslation();

  return (
    <header className="bg-surface-container-lowest/80 backdrop-blur-md w-full top-0 left-0 z-50 flex justify-between items-center px-6 h-16 fixed border-b border-outline-variant/10 animate-fade-in">
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined text-on-surface hover:opacity-80 transition-opacity cursor-pointer">
          menu
        </span>
        <h1 className="text-2xl font-bold tracking-tighter text-primary font-headline">
          {t('app.title', 'BENSA')}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {children ?? (
          <span className="material-symbols-outlined text-on-surface hover:opacity-80 transition-opacity cursor-pointer">
            account_circle
          </span>
        )}
      </div>
    </header>
  );
};
