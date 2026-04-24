/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  History, 
  LayoutDashboard, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { PrayerEntry } from './types';

// Utils
const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

const getDisplayDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const STORAGE_KEY = 'sholat_entries_v1';

 export default function App() {
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()));
  const [entries, setEntries] = useState<PrayerEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'daily' | 'history'>('daily');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load entries
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved entries", e);
      }
    }
  }, []);

  // Save entries
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const getEntry = (prayer: 'Zuhur' | 'Ashar', date: string) => {
    return entries.find(e => e.date === date && e.prayer === prayer);
  };

  const toggleStatus = (prayer: 'Zuhur' | 'Ashar', field: keyof Omit<PrayerEntry, 'id' | 'date' | 'prayer' | 'timestamp'>) => {
    const existing = entries.find(e => e.date === currentDate && e.prayer === prayer);
    
    if (existing) {
      setEntries(prev => prev.map(e => {
        if (e.id === existing.id) {
          return { ...e, [field]: !e[field], timestamp: Date.now() };
        }
        return e;
      }));
    } else {
      const newEntry: PrayerEntry = {
        id: crypto.randomUUID(),
        date: currentDate,
        prayer,
        fard: false,
        qobliyah: false,
        badiyah: false,
        timestamp: Date.now()
      };
      (newEntry as any)[field] = true;
      setEntries(prev => [...prev, newEntry]);
    }
  };

  const deleteEntry = (id: string) => {
    if (confirm('Hapus catatan ini?')) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const PrayerCard = ({ type }: { type: 'Zuhur' | 'Ashar' }) => {
    const entry = getEntry(type, currentDate);
    const hasBadiyah = type === 'Zuhur';
    const accentColor = type === 'Zuhur' ? 'forest' : 'ochre';

    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col justify-between h-full min-h-[320px]"
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <span className={`px-3 py-1 bg-${accentColor}/10 text-${accentColor} rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 inline-block`}>
              {type === 'Zuhur' ? 'Siang Hari' : 'Sore Hari'}
            </span>
            <h2 className="text-4xl font-serif italic text-slate-dark">Sholat {type}</h2>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase tracking-widest opacity-40 block mb-1">Status</span>
            <span className={`text-sm font-mono font-bold ${entry?.fard ? 'text-forest' : 'opacity-30'}`}>
              {entry?.fard ? 'TERCATAT' : 'BELUM'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <button 
            onClick={() => toggleStatus(type, 'fard')}
            className={`w-full flex items-center justify-center gap-3 p-5 rounded-xl transition-all border-2 ${
              entry?.fard 
                ? `bg-${accentColor} border-transparent text-white shadow-lg` 
                : `bg-white border-${accentColor} text-${accentColor} hover:bg-${accentColor}/5`
            }`}
          >
            <span className="text-sm font-bold uppercase tracking-[0.2em]">
              {entry?.fard ? 'Tercatat' : 'Input Fardhu'}
            </span>
            {entry?.fard && <div className="w-5 h-5 bg-white text-forest rounded-full flex items-center justify-center text-[10px]">✓</div>}
          </button>

          <div className="grid grid-cols-2 gap-4">
            <div className={`border-l-2 border-${accentColor} pl-4`}>
              <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Qobliyah</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Sunnah</p>
                <button onClick={() => toggleStatus(type, 'qobliyah')} className="p-1">
                   <div className={`w-5 h-5 rounded-sm transition-colors ${entry?.qobliyah ? `bg-${accentColor}` : 'bg-gray-100 border border-gray-200'}`}></div>
                </button>
              </div>
            </div>

            {hasBadiyah && (
              <div className={`border-l-2 border-${accentColor} pl-4`}>
                <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Ba'diyah</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Sunnah</p>
                  <button onClick={() => toggleStatus(type, 'badiyah')} className="p-1">
                     <div className={`w-5 h-5 rounded-sm transition-colors ${entry?.badiyah ? `bg-${accentColor}` : 'bg-gray-100 border border-gray-200'}`}></div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const navItems = [
    { id: 'daily', label: 'Monitor Hari Ini', icon: LayoutDashboard },
    { id: 'history', label: 'Arsip & Rekap', icon: History },
  ];

  return (
    <div className="min-h-screen bg-parchment font-sans text-slate-dark p-4 sm:p-8">
      {/* Header Geometric Style */}
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-end mb-12 border-b border-forest/20 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-serif italic text-forest">Muroqabah Sholat</h1>
          <p className="text-[10px] tracking-widest uppercase opacity-60">Personal Prayer & Rawatib Tracker</p>
        </div>
        
        <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
          <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-forest/10 mb-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === item.id 
                    ? 'bg-forest text-white shadow-md' 
                    : 'text-forest/60 hover:bg-forest/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="text-center sm:text-right">
            <p className="text-lg font-medium">{getDisplayDate(currentDate)}</p>
            {currentDate === formatDate(new Date()) && (
               <p className="text-[10px] font-mono uppercase tracking-widest text-forest font-bold">Waktu Sekarang</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'daily' ? (
            <motion.div
              key="daily"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-12 gap-8"
            >
              <div className="col-span-12 lg:col-span-7 flex flex-col gap-8">
                <div className="flex items-center justify-between bg-white/40 p-4 rounded-2xl border border-forest/10">
                   <button onClick={() => changeDate(-1)} className="p-2 hover:bg-forest/10 rounded-lg text-forest transition-colors">
                     <ChevronLeft className="w-5 h-5" />
                   </button>
                   <span className="text-sm font-mono tracking-tighter font-semibold">{currentDate}</span>
                   <button onClick={() => changeDate(1)} className="p-2 hover:bg-forest/10 rounded-lg text-forest transition-colors">
                     <ChevronRight className="w-5 h-5" />
                   </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <PrayerCard type="Zuhur" />
                  <PrayerCard type="Ashar" />
                </div>
              </div>

              <div className="col-span-12 lg:col-span-5 flex flex-col gap-8">
                <div className="bg-slate-dark text-white rounded-3xl p-8 flex-grow shadow-2xl relative overflow-hidden">
                  <h3 className="text-2xl font-serif italic mb-8 border-b border-white/10 pb-4">Insight Hari Ini</h3>
                  
                  <div className="space-y-10 relative z-10">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs uppercase tracking-widest opacity-60">Pencatatan Hari Ini</span>
                        <span className="text-3xl font-mono text-ochre">
                           {entries.filter(e => e.date === currentDate).length}/2
                        </span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-forest h-full transition-all duration-1000"
                          style={{ width: `${(entries.filter(e => e.date === currentDate).length / 2) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                        <span className="text-[10px] uppercase tracking-[0.2em] opacity-40 block mb-2">Total Ibadah</span>
                        <div className="text-3xl font-serif">{entries.length}</div>
                      </div>
                      <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                        <span className="text-[10px] uppercase tracking-[0.2em] opacity-40 block mb-2">Ibadah Fardhu</span>
                        <div className="text-3xl font-serif">{entries.filter(e => e.fard).length}</div>
                      </div>
                    </div>

                    <div className="pt-6">
                       <p className="text-xs italic text-white/40 leading-relaxed text-center">
                         "Istiqomah adalah kunci keberkahan waktu."
                       </p>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-forest/20 blur-[120px] -mr-32 -mt-32"></div>
                </div>

                <div className="flex gap-4">
                  <button className="flex-grow py-5 bg-forest text-white rounded-xl font-bold uppercase tracking-[0.3em] shadow-xl shadow-forest/20 hover:bg-forest/90 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm">
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="bg-slate-dark text-white rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/10 flex justify-between items-center">
                  <h3 className="text-2xl font-serif italic">Riwayat Catatan</h3>
                  <div className="bg-white/10 px-4 py-1.5 rounded-full text-xs font-mono tracking-widest uppercase">
                    Total: {entries.length}
                  </div>
                </div>
                
                <div className="max-h-[600px] overflow-y-auto">
                  {entries.length === 0 ? (
                    <div className="p-20 text-center opacity-30 italic font-serif">Belum ada catatan syahadat...</div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {[...entries].sort((a,b) => b.timestamp - a.timestamp).map(entry => (
                        <div key={entry.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                           <div className="flex items-center gap-6">
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-serif text-lg ${entry.prayer === 'Zuhur' ? 'bg-forest/20 text-forest' : 'bg-ochre/20 text-ochre'}`}>
                               {entry.prayer[0]}
                             </div>
                             <div>
                               <div className="font-serif text-xl tracking-tight">Sholat {entry.prayer}</div>
                               <div className="text-xs font-mono opacity-40 uppercase tracking-widest">{getDisplayDate(entry.date)}</div>
                             </div>
                           </div>
                           <div className="flex items-center gap-8">
                              <div className="flex gap-2">
                                <div className={`px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-widest ${entry.fard ? 'bg-forest text-white' : 'bg-white/10 opacity-30 text-white'}`}>Fardhu</div>
                                <div className={`px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-widest ${entry.qobliyah ? 'bg-ochre text-white' : 'bg-white/10 opacity-30 text-white'}`}>Qobliyah</div>
                                {entry.prayer === 'Zuhur' && (
                                  <div className={`px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-widest ${entry.badiyah ? 'bg-ochre text-white' : 'bg-white/10 opacity-30 text-white'}`}>Ba'diyah</div>
                                )}
                              </div>
                              <button onClick={() => deleteEntry(entry.id)} className="p-2 text-white/20 hover:text-red-400 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                   { label: 'Intensitas Mingguan', value: '92%', detail: 'Sangat Baik' },
                   { label: 'Rawatib Terpenuhi', value: entries.filter(e => e.qobliyah || e.badiyah).length, detail: 'Pahal Berlipat' },
                   { label: 'Streak Ibadah', value: '5 Hari', detail: 'Pertahankan!' },
                   { label: 'Efisiensi Waktu', value: 'Baik', detail: 'Tepat Waktu' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200">
                     <span className="text-[10px] uppercase tracking-widest opacity-40 block mb-2">{stat.label}</span>
                     <div className="text-3xl font-serif text-forest mb-1">{stat.value}</div>
                     <span className="text-[10px] font-bold text-ochre uppercase">{stat.detail}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-6xl mx-auto mt-16 pt-8 border-t border-forest/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.3em] opacity-40 text-center">
        <span>V.1.0.2 Sustainable Faith System</span>
        <div className="flex gap-4">
           <span>Istiqomah</span>
           <span>•</span>
           <span>Ikhlas</span>
           <span>•</span>
           <span>Ihsan</span>
        </div>
        <span>© {new Date().getFullYear()} SholatTrack</span>
      </footer>
    </div>
  );
}
