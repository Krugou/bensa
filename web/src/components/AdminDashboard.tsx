import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { auth, googleProvider } from '../firebase';

export const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success(t('auth.success_google', 'Logged in with Google'));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage);
    }
  };

  const handleEmailAuth = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success(t('auth.success_register', 'Account created successfully'));
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success(t('auth.success_login', 'Logged in successfully'));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success(t('auth.success_logout', 'Logged out successfully'));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(errorMessage);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#060610] text-white/90 font-sans flex flex-col items-center justify-center p-4">
        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-bensa-violet/2 rounded-full blur-[150px] animate-glow-breathe" />
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-xl max-w-md w-full relative z-10 shadow-2xl">
          <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-bensa-teal to-fuel-green mb-8 text-center uppercase tracking-tight">
            Administrator
          </h1>

          <form
            onSubmit={(e) => {
              void handleEmailAuth(e);
            }}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="admin-email"
                className="block text-sm font-medium text-white/60 mb-1 uppercase tracking-wider"
              >
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuel-green/50 transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium text-white/60 mb-1 uppercase tracking-wider"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuel-green/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-bensa-teal/80 to-fuel-green/80 hover:from-bensa-teal hover:to-fuel-green text-black font-bold py-3 rounded-xl transition-all uppercase tracking-widest mt-4 shadow-[0_0_15px_rgba(0,255,136,0.3)]"
            >
              {isRegistering ? 'Register' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
              }}
              className="text-sm text-bensa-cyan hover:text-white transition-colors"
            >
              {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
            </button>
          </div>

          <div className="my-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10 text-white/40 uppercase text-sm tracking-widest">
            or
          </div>

          <button
            onClick={() => {
              void handleGoogleLogin();
            }}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          <button
            onClick={() => {
              void navigate('/');
            }}
            className="mt-8 text-white/40 hover:text-white transition-colors w-full text-center text-sm"
          >
            ← Back to Tracker
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060610] text-white/90 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12 bg-white/5 border border-white/10 p-4 md:p-6 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-bensa-teal to-fuel-green uppercase tracking-tight">
              Admin Portal
            </h1>
            <span className="bg-fuel-green/20 text-fuel-green px-3 py-1 rounded-full text-xs font-bold font-mono border border-fuel-green/30">
              {user.email}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                void navigate('/');
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
            >
              View Site
            </button>
            <button
              onClick={() => {
                void handleLogout();
              }}
              className="px-4 py-2 rounded-xl bg-fuel-red/20 hover:bg-fuel-red/40 text-fuel-red border border-fuel-red/30 transition-colors text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2 space-y-6">
            {/* Main Admin Content Area */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">🤖</span> Scraper Status
              </h2>
              <div className="bg-black/40 rounded-xl p-4 font-mono text-sm border border-white/5">
                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                  <span className="text-white/60 uppercase tracking-widest text-xs">
                    Bot Status
                  </span>
                  <span className="text-fuel-green flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-fuel-green animate-pulse" />
                    Active (Cron)
                  </span>
                </div>
                <div className="space-y-3">
                  <p>
                    <span className="text-white/40">Last Run:</span> a few minutes ago
                  </p>
                  <p>
                    <span className="text-white/40">Stations:</span> 135
                  </p>
                  <p>
                    <span className="text-white/40">Errors:</span>{' '}
                    <span className="text-bensa-cyan">0</span>
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">🌍</span> Geocoding API Traffic
              </h2>
              <div className="h-48 flex items-end justify-between gap-2 px-2 pb-4 pt-8 bg-black/40 rounded-xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-4 left-4 text-xs font-mono text-white/40 uppercase">
                  Requests / hr
                </div>
                {/* Simulated mock graph data */}
                {[20, 45, 10, 80, 120, 60, 40, 90, 75, 45, 10, 80, 150, 40].map((h, i) => (
                  <div
                    key={i}
                    className="w-full bg-bensa-violet/50 hover:bg-bensa-violet transition-colors rounded-t-sm"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            {/* Sidebar Area */}
            <section className="bg-gradient-to-b from-fuel-yellow/20 to-transparent border border-fuel-yellow/20 rounded-2xl p-6 md:p-8 backdrop-blur-md">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-fuel-yellow text-2xl">⚡</span> Quick Actions
              </h2>
              <div className="space-y-3">
                <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl text-left transition-colors text-sm font-medium flex justify-between items-center">
                  Trigger Manual Scrape
                  <span className="text-white/40">→</span>
                </button>
                <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl text-left transition-colors text-sm font-medium flex justify-between items-center">
                  Clear Cache
                  <span className="text-white/40">→</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
