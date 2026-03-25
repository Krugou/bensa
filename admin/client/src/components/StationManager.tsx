import { Edit2, Lock, MapPin, Search, Trash2, Unlock, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { GasStation } from '../types';

const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:3007';

export const StationManager = () => {
  const { t } = useTranslation();
  const [stations, setStations] = useState<GasStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStation, setEditingStation] = useState<GasStation | null>(null);

  const fetchStations = async () => {
    console.log(`[STATIONS] Fetching stations from ${ADMIN_API_BASE}/api/stations...`);
    setLoading(true);
    try {
      const response = await axios.get(`${ADMIN_API_BASE}/api/stations`);
      console.log(`[STATIONS] Received ${response.data.length} stations`);
      setStations(response.data);
    } catch (err: any) {
      console.error('[STATIONS] Failed to fetch stations:', err.response?.data || err.message);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const filteredStations = stations.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleLock = async (station: GasStation) => {
    const newStatus = !station.userFixed;
    console.log(`[STATIONS] Toggling lock for ${station.id} to ${newStatus}...`);
    try {
      await axios.post(`${ADMIN_API_BASE}/api/stations/${station.id}/toggle-lock`, { locked: newStatus });
      console.log(`[STATIONS] Lock toggled for ${station.id}`);
      setStations(stations.map(s => s.id === station.id ? { ...s, userFixed: newStatus } : s));
      toast.info(newStatus ? t('stations.locked') : t('stations.unlock'));
    } catch (err: any) {
      console.error(`[STATIONS] Failed to toggle lock for ${station.id}:`, err.response?.data || err.message);
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this station?')) return;
    console.log(`[STATIONS] Deleting station ${id}...`);
    try {
      await axios.delete(`${ADMIN_API_BASE}/api/stations/${id}`);
      console.log(`[STATIONS] Station ${id} deleted`);
      setStations(stations.filter(s => s.id !== id));
      toast.success(t('common.success'));
    } catch (err: any) {
      console.error(`[STATIONS] Failed to delete station ${id}:`, err.response?.data || err.message);
      toast.error(t('common.error'));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStation) return;
    console.log(`[STATIONS] Updating station ${editingStation.id}...`, editingStation);
    try {
      const { id, ...data } = editingStation;
      await axios.put(`${ADMIN_API_BASE}/api/stations/${id}`, data);
      console.log(`[STATIONS] Station ${id} updated`);
      setStations(stations.map(s => s.id === id ? { ...editingStation, userFixed: true } : s));
      setEditingStation(null);
      toast.success(t('common.success'));
    } catch (err: any) {
      console.error(`[STATIONS] Failed to update station ${editingStation.id}:`, err.response?.data || err.message);
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-bensa-teal to-fuel-green uppercase">
            {t('stations.title')}
          </h2>
          <p className="text-slate-400 mt-1">{t('stations.subtitle')}</p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder={t('stations.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-fuel-green transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-fuel-green/30 border-t-fuel-green rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredStations.map((station) => (
            <div
              key={station.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors group"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg truncate">{station.name}</h3>
                    {station.userFixed && (
                      <span className="bg-bensa-cyan/10 text-bensa-cyan border border-bensa-cyan/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                        {t('stations.locked')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 font-bold uppercase border border-slate-800">
                      {station.brand}
                    </span>
                    <span className="text-xs text-slate-500">{station.city}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
                    <MapPin size={14} className="text-slate-600" />
                    {station.address}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => void handleToggleLock(station)}
                    className={`p-2 rounded-xl border transition-all ${
                      station.userFixed
                        ? 'bg-bensa-cyan/10 border-bensa-cyan/20 text-bensa-cyan'
                        : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400'
                    }`}
                    title={station.userFixed ? t('stations.unlock') : t('stations.lock')}
                  >
                    {station.userFixed ? <Lock size={18} /> : <Unlock size={18} />}
                  </button>
                  <button
                    onClick={() => setEditingStation(station)}
                    className="p-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-fuel-green hover:border-fuel-green/30 rounded-xl transition-all"
                    title={t('stations.edit')}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => void handleDelete(station.id)}
                    className="p-2 bg-slate-950 border border-slate-800 text-slate-600 hover:text-fuel-red hover:border-fuel-red/30 rounded-xl transition-all"
                    title={t('stations.delete')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {station.prices.map((p) => (
                  <div key={p.type} className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-600">{p.type}</span>
                    <span className="text-sm font-mono font-bold text-fuel-green">{p.price.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingStation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black italic tracking-tight uppercase">{t('stations.editStation')}</h3>
              <button onClick={() => setEditingStation(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={(e) => void handleUpdate(e)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label={t('stations.fields.name')}>
                  <input
                    type="text"
                    value={editingStation.name}
                    onChange={(e) => setEditingStation({ ...editingStation, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-fuel-green outline-none"
                  />
                </Field>
                <Field label={t('stations.fields.brand')}>
                  <input
                    type="text"
                    value={editingStation.brand}
                    onChange={(e) => setEditingStation({ ...editingStation, brand: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-fuel-green outline-none"
                  />
                </Field>
                <Field label={t('stations.fields.address')}>
                  <input
                    type="text"
                    value={editingStation.address}
                    onChange={(e) => setEditingStation({ ...editingStation, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-fuel-green outline-none"
                  />
                </Field>
                <Field label={t('stations.fields.city')}>
                  <input
                    type="text"
                    value={editingStation.city}
                    onChange={(e) => setEditingStation({ ...editingStation, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-fuel-green outline-none"
                  />
                </Field>
                <Field label={t('stations.fields.lat')}>
                  <input
                    type="number"
                    step="any"
                    value={editingStation.lat}
                    onChange={(e) => setEditingStation({ ...editingStation, lat: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-fuel-green outline-none"
                  />
                </Field>
                <Field label={t('stations.fields.lon')}>
                  <input
                    type="number"
                    step="any"
                    value={editingStation.lon}
                    onChange={(e) => setEditingStation({ ...editingStation, lon: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-fuel-green outline-none"
                  />
                </Field>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{t('stations.fields.prices')}</label>
                <div className="space-y-3">
                  {editingStation.prices.map((p, idx) => (
                    <div key={p.type} className="flex items-center gap-4 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                      <span className="w-16 text-xs font-black uppercase text-slate-400">{p.type}</span>
                      <input
                        type="number"
                        step="0.001"
                        value={p.price}
                        onChange={(e) => {
                          const newPrices = [...editingStation.prices];
                          newPrices[idx] = { ...p, price: parseFloat(e.target.value) };
                          setEditingStation({ ...editingStation, prices: newPrices });
                        }}
                        className="flex-1 bg-transparent border-b border-slate-800 focus:border-fuel-green outline-none px-2 py-1 font-mono text-fuel-green"
                      />
                      <span className="text-slate-600 text-[10px] font-mono">{new Date(p.updatedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="submit" className="flex-1 bg-fuel-green text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                  {t('stations.saveAndLock')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStation(null)}
                  className="px-8 bg-slate-950 border border-slate-800 text-slate-400 font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all"
                >
                  {t('stations.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);
