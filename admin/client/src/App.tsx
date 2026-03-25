import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { LayoutDashboard, LogOut, MapPin, Settings, Globe } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';

import './i18n';
import { auth, googleProvider } from './firebase';
import { Dashboard } from './components/Dashboard';
import { StationManager } from './components/StationManager';

const App = () => {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-fuel-green/30 border-t-fuel-green rounded-full animate-spin" />
      </div>
    );
  }

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

  if (!user) {
    return <Login />;
  }

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
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold">{user.email?.[0].toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.displayName || 'Admin'}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => void signOut(auth)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-fuel-red hover:bg-fuel-red/10 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              {t('nav.signOut')}
            </button>
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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Logged in');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Logged in with Google');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-bensa-teal to-fuel-green rounded-2xl flex items-center justify-center font-black text-3xl text-black italic">
            B
          </div>
        </div>
        <h1 className="text-3xl font-black text-center italic mb-2 tracking-tight">ADMIN PORTAL</h1>
        <p className="text-slate-400 text-center mb-8">Secure Access Only</p>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-fuel-green transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-fuel-green transition-colors"
              required
            />
          </div>
          <button className="w-full bg-fuel-green text-black font-black py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-fuel-green/20">
            {isRegistering ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </button>
        </form>

        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="w-full text-center mt-4 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Register'}
        </button>

        <div className="my-8 flex items-center gap-4 text-slate-700">
          <div className="flex-1 h-px bg-slate-800"></div>
          <span className="text-xs font-bold uppercase tracking-widest">OR</span>
          <div className="flex-1 h-px bg-slate-800"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-slate-950 border border-slate-800 py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-900 transition-colors font-bold"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default App;
