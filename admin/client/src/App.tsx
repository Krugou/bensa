import { LayoutDashboard, LogOut, MapPin, Settings, Globe, User as UserIcon } from 'lucide-react';
import React from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';

import './i18n';
import { Dashboard } from './components/Dashboard';
import { StationManager } from './components/StationManager';

const App = () => {
  const { t, i18n } = useTranslation();

  const isLocal =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (!isLocal) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-8 font-mono">
        <div className="text-fuel-red text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold mb-2">{t('common.accessDenied')}</h1>
        <p className="text-slate-400 text-center max-w-md">
          {t('common.localOnly')}
        </p>
      </div>
    );
  }

  const mockUser = {
    displayName: 'Local Admin',
    email: 'admin@localhost',
    photoURL: null,
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fi' : 'en';
    void i18n.changeLanguage(newLang);
  };

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-950 text-slate-50">
        {/* Sidebar */}
        <nav className="w-64 border-r border-slate-800 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-gradient-to-br from-bensa-teal to-fuel-green rounded-lg flex items-center justify-center font-bold text-black italic">
              B
            </div>
            <h1 className="text-xl font-black italic tracking-tight">ADMIN</h1>
          </div>

          <div className="space-y-2 flex-1">
            <SidebarLink to="/" icon={<LayoutDashboard size={20} />} label={t('nav.dashboard')} />
            <SidebarLink to="/stations" icon={<MapPin size={20} />} label={t('nav.stations')} />
            <SidebarLink to="/settings" icon={<Settings size={20} />} label={t('nav.settings')} />
          </div>

          <div className="mt-auto pt-6 border-t border-slate-800">
            <button
              onClick={toggleLanguage}
              className="w-full flex items-center gap-3 px-4 py-2 mb-4 text-sm font-medium text-slate-400 hover:text-bensa-teal hover:bg-bensa-teal/10 rounded-lg transition-colors uppercase tracking-widest"
            >
              <Globe size={18} />
              {i18n.language.toUpperCase()}
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                <UserIcon size={20} className="text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{mockUser.displayName}</p>
                <p className="text-xs text-slate-500 truncate">{mockUser.email}</p>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stations" element={<StationManager />} />
            <Route path="/settings" element={<div>{t('nav.settings')} (Placeholder)</div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <ToastContainer position="bottom-right" theme="dark" />
    </BrowserRouter>
  );
};

const SidebarLink = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => {
  const active = window.location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
        active
          ? 'bg-fuel-green/10 text-fuel-green font-bold'
          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
};

export default App;
