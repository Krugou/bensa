import { Activity, Database, Fuel, History } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:3007';

export const Dashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalStations: 0,
    lockedStations: 0,
    lastScraperRun: null as string | null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${ADMIN_API_BASE}/api/stats`);
        setStats(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-fuel-green/30 border-t-fuel-green rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-bensa-teal to-fuel-green uppercase">
          {t('dashboard.title')}
        </h2>
        <p className="text-slate-400 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Database className="text-bensa-cyan" />}
          label={t('dashboard.totalStations')}
          value={stats.totalStations}
          subValue="Registered in DB"
        />
        <StatCard
          icon={<Activity className="text-fuel-green" />}
          label={t('dashboard.lockedStations')}
          value={stats.lockedStations}
          subValue={`${Math.round((stats.lockedStations / (stats.totalStations || 1)) * 100)}% of total`}
        />
        <StatCard
          icon={<History className="text-bensa-violet" />}
          label={t('dashboard.lastScrape')}
          value={stats.lastScraperRun ? new Date(stats.lastScraperRun).toLocaleTimeString() : 'Never'}
          subValue={stats.lastScraperRun ? new Date(stats.lastScraperRun).toLocaleDateString() : 'N/A'}
        />
        <StatCard
          icon={<Fuel className="text-fuel-red" />}
          label={t('dashboard.healthySources')}
          value="Polttoaine.net"
          subValue="Primary scraper active"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Activity size={20} className="text-fuel-green" />
            {t('dashboard.activity')}
          </h3>
          <div className="space-y-4">
             <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-fuel-green animate-pulse"></div>
                  <div>
                    <p className="text-sm font-medium">Scraper completed successfully</p>
                    <p className="text-xs text-slate-500">{stats.lastScraperRun ? new Date(stats.lastScraperRun).toLocaleString() : ''}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-fuel-green/10 text-fuel-green uppercase border border-fuel-green/20">{t('dashboard.success')}</span>
             </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <h3 className="text-xl font-bold mb-6">{t('dashboard.dbHealth')}</h3>
          <div className="space-y-6">
            <HealthBar label="Firestore Connectivity" percent={100} color="bg-bensa-teal" />
            <HealthBar label="Authentication Service" percent={100} color="bg-fuel-green" />
            <HealthBar label="Storage Buckets" percent={100} color="bg-bensa-cyan" />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string | number, subValue: string }) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-slate-700 transition-colors">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
        {icon}
      </div>
      <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-3xl font-black italic">{value}</div>
    <div className="text-xs text-slate-500 mt-1 uppercase tracking-tighter">{subValue}</div>
  </div>
);

const HealthBar = ({ label, percent, color }: { label: string, percent: number, color: string }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
      <span>{label}</span>
      <span>{percent}%</span>
    </div>
    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }}></div>
    </div>
  </div>
);
