/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  History, 
  LayoutDashboard, 
  ChevronLeft, 
  ChevronRight,
  Trash2,
  Users,
  User,
  LogOut,
  ShieldCheck,
  RefreshCcw,
  ArrowRight,
  Download,
  GraduationCap
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

export default function App() {
  const [role, setRole] = useState<'student' | 'teacher' | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [currentDate, setCurrentDate] = useState(formatDate(new Date()));
  const [entries, setEntries] = useState<PrayerEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'daily' | 'history' | 'teacher'>('daily');
  const [isLoading, setIsLoading] = useState(false);

  // Load context from local storage if available
  useEffect(() => {
    const savedRole = localStorage.getItem('user_role');
    const savedName = localStorage.getItem('student_name');
    const savedClass = localStorage.getItem('student_class');
    if (savedRole) setRole(savedRole as any);
    if (savedName) setStudentName(savedName);
    if (savedClass) setStudentClass(savedClass);
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (e) {
      console.error("Fetch failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (selectedRole: 'student' | 'teacher', name?: string, sClass?: string) => {
    if (selectedRole === 'student' && (!name?.trim() || !sClass?.trim())) return;
    setRole(selectedRole);
    if (name) {
      setStudentName(name);
      localStorage.setItem('student_name', name);
    }
    if (sClass) {
      setStudentClass(sClass);
      localStorage.setItem('student_class', sClass);
    }
    localStorage.setItem('user_role', selectedRole);
    if (selectedRole === 'teacher') setActiveTab('teacher');
  };

  const submitEntry = async (entry: PrayerEntry) => {
    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      fetchEntries();
    } catch (e) {
      console.error("Submit failed", e);
    }
  };

  const toggleStatus = (prayer: 'Zuhur' | 'Ashar', field: keyof Omit<PrayerEntry, 'id' | 'date' | 'prayer' | 'timestamp' | 'studentName' | 'studentClass'>) => {
    const existing = entries.find(e => e.date === currentDate && e.prayer === prayer && e.studentName === studentName);
    
    let updatedEntry: PrayerEntry;

    if (existing) {
      updatedEntry = { ...existing, [field]: !existing[field], timestamp: Date.now() };
    } else {
      updatedEntry = {
        id: crypto.randomUUID(),
        studentName,
        studentClass,
        date: currentDate,
        prayer,
        fard: false,
        qobliyah: false,
        badiyah: false,
        timestamp: Date.now()
      };
      (updatedEntry as any)[field] = true;
    }
    submitEntry(updatedEntry);
  };

  const deleteEntry = async (id: string) => {
    if (confirm('Hapus catatan ini?')) {
      try {
        await fetch(`/api/entry/${id}`, { method: 'DELETE' });
        fetchEntries();
      } catch (e) {
        console.error("Delete failed", e);
      }
    }
  };

  const changeDate = (days: number) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + days);
    setCurrentDate(formatDate(date));
  };

  const logout = () => {
    localStorage.removeItem('user_role');
    setRole(null);
  };

  const exportToExcel = () => {
    const dataToExport = entries.map(e => ({
      'Tanggal': e.date,
      'Nama': e.studentName,
      'Kelas': e.studentClass,
      'Sholat': e.prayer,
      'Fardhu': e.fard ? 'Ya' : 'Tidak',
      'Qobliyah': e.qobliyah ? 'Ya' : 'Tidak',
      'Ba\'diyah': e.badiyah ? 'Ya' : 'Tidak',
      'Terakhir Update': new Date(e.timestamp).toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Sholat");
    XLSX.writeFile(wb, `Rekap_Sholat_${formatDate(new Date())}.xlsx`);
  };

  // View: Login
  if (!role) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-10 rounded-[32px] shadow-2xl border border-forest/10 w-full max-w-md"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-forest rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-forest/20">
               <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-serif italic text-forest">Sistem Muroqabah</h1>
            <p className="text-xs uppercase tracking-widest opacity-40 mt-1">Silakan Pilih Identitas</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-bold tracking-widest text-forest/60 ml-2">Nama Siswa</label>
                 <input 
                    type="text" 
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Contoh: Ahmad"
                    className="w-full bg-parchment p-3 rounded-xl border border-forest/10 focus:outline-none focus:border-forest/40 font-medium text-sm"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] uppercase font-bold tracking-widest text-forest/60 ml-2">Kelas</label>
                 <input 
                    type="text" 
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    placeholder="Contoh: 10A"
                    className="w-full bg-parchment p-3 rounded-xl border border-forest/10 focus:outline-none focus:border-forest/40 font-medium text-sm"
                 />
              </div>
            </div>
            
            <button 
              onClick={() => handleLogin('student', studentName, studentClass)}
              className="w-full py-4 bg-forest text-white rounded-xl font-bold uppercase tracking-[0.2em] shadow-lg shadow-forest/20 hover:bg-forest/90 transition-all flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" /> Masuk Sebagai Siswa
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-forest/10"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-forest/40 tracking-widest">Atau</span></div>
            </div>

            <button 
              onClick={() => handleLogin('teacher')}
              className="w-full py-4 border-2 border-ochre text-ochre rounded-xl font-bold uppercase tracking-[0.2em] hover:bg-ochre/5 transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" /> Masuk Sebagai Guru
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const PrayerCard = ({ type }: { type: 'Zuhur' | 'Ashar' }) => {
    const entry = entries.find(e => e.date === currentDate && e.prayer === type && e.studentName === studentName);
    const hasBadiyah = type === 'Zuhur';
    const accentColor = type === 'Zuhur' ? 'forest' : 'ochre';

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col justify-between h-full min-h-[320px]">
        <div className="flex justify-between items-start mb-8">
          <div>
            <span className={`px-3 py-1 bg-${accentColor}/10 text-${accentColor} rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 font-sans inline-block`}>
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
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-parchment font-sans text-slate-dark p-4 sm:p-8">
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-end mb-12 border-b border-forest/20 pb-6 gap-4">
        <div className="flex items-center gap-6">
           <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${role === 'teacher' ? 'bg-ochre' : 'bg-forest'}`}>
              {role === 'teacher' ? <Users className="w-6 h-6" /> : <User className="w-6 h-6" />}
           </div>
           <div>
              <h1 className="text-3xl font-serif italic text-forest">Muroqabah Online</h1>
              <p className="text-[10px] tracking-widest uppercase opacity-60">
                {role === 'teacher' ? 'Dashboard Guru' : `Siswa: ${studentName} (${studentClass})`}
              </p>
           </div>
        </div>
        
        <div className="flex flex-col items-center sm:items-end w-full sm:w-auto gap-4">
          <div className="flex items-center gap-2">
            <button onClick={fetchEntries} className="p-2 text-forest/60 hover:text-forest transition-colors">
              <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-2 bg-white/50 p-1 rounded-xl border border-forest/10">
              {role === 'student' ? (
                <>
                  <button onClick={() => setActiveTab('daily')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider ${activeTab === 'daily' ? 'bg-forest text-white' : 'text-forest/60'}`}>Harian</button>
                  <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider ${activeTab === 'history' ? 'bg-forest text-white' : 'text-forest/60'}`}>Riwayat</button>
                </>
              ) : (
                <>
                  <button className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-ochre text-white">Monitoring</button>
                  <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-forest hover:bg-forest/5">
                    <Download className="w-3 h-3" /> Ekspor Excel
                  </button>
                </>
              )}
            </div>
            <button onClick={logout} className="p-2 text-red-400 hover:text-red-600 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <div className="text-right">
            <p className="text-lg font-medium font-serif">{getDisplayDate(currentDate)}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {role === 'student' && activeTab === 'daily' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-12 gap-8">
              <div className="col-span-12 lg:col-span-12 space-y-8">
                <div className="flex items-center justify-between bg-white/40 p-4 rounded-2xl border border-forest/10">
                   <button onClick={() => changeDate(-1)} className="p-2 hover:bg-forest/10 rounded-lg text-forest"><ChevronLeft /></button>
                   <span className="text-sm font-mono font-bold tracking-tighter">{currentDate}</span>
                   <button onClick={() => changeDate(1)} className="p-2 hover:bg-forest/10 rounded-lg text-forest"><ChevronRight /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <PrayerCard type="Zuhur" />
                  <PrayerCard type="Ashar" />
                </div>
              </div>
            </motion.div>
          )}

          {role === 'student' && activeTab === 'history' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-dark text-white rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/10 flex justify-between">
                <h3 className="text-2xl font-serif italic">Catatan Saya</h3>
                <span className="opacity-40">{entries.filter(e => e.studentName === studentName).length} Item</span>
              </div>
              <div className="divide-y divide-white/5">
                {entries.filter(e => e.studentName === studentName).map(entry => (
                  <div key={entry.id} className="p-6 flex justify-between items-center">
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold font-serif ${entry.prayer === 'Zuhur' ? 'bg-forest' : 'bg-ochre'}`}>{entry.prayer[0]}</div>
                      <div>
                        <div className="font-medium font-serif text-lg">Sholat {entry.prayer}</div>
                        <div className="text-[10px] opacity-40 font-mono tracking-widest uppercase">{entry.date}</div>
                      </div>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="flex gap-1 text-[8px] font-bold">
                        <div className={`px-2 py-0.5 rounded ${entry.fard ? 'bg-forest' : 'bg-white/10 opacity-30'}`}>F</div>
                        <div className={`px-2 py-0.5 rounded ${entry.qobliyah ? 'bg-ochre' : 'bg-white/10 opacity-30'}`}>Q</div>
                        <div className={`px-2 py-0.5 rounded ${entry.badiyah ? 'bg-ochre' : 'bg-white/10 opacity-30'}`}>B</div>
                      </div>
                      <button onClick={() => deleteEntry(entry.id)} className="text-white/20 hover:text-red-400 p-2"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {role === 'teacher' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-3xl border border-gray-200">
                    <span className="text-[10px] uppercase tracking-widest opacity-40">Total Siswa Aktif</span>
                    <div className="text-5xl font-serif text-forest">{Array.from(new Set(entries.map(e => e.studentName))).length}</div>
                  </div>
                  <div className="bg-slate-dark text-white p-8 rounded-3xl">
                    <span className="text-[10px] uppercase tracking-widest opacity-40">Total Catatan Masuk</span>
                    <div className="text-5xl font-serif text-ochre">{entries.length}</div>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-gray-200">
                    <span className="text-[10px] uppercase tracking-widest opacity-40">Kepatuhan Fardhu</span>
                    <div className="text-5xl font-serif text-forest">
                      {entries.length ? Math.round((entries.filter(e => e.fard).length / entries.length) * 100) : 0}%
                    </div>
                  </div>
               </div>

               <div className="bg-white rounded-3xl border border-forest/10 overflow-hidden shadow-sm">
                  <div className="p-6 bg-forest/5 border-b border-forest/10 flex justify-between items-center">
                     <h3 className="font-serif italic text-xl">Laporan Monitoring</h3>
                     <div className="flex gap-4">
                        <button onClick={() => changeDate(-1)} className="p-2 border border-forest/10 rounded-lg hover:bg-forest/5"><ChevronLeft className="w-4 h-4" /></button>
                        <div className="px-4 py-2 font-mono font-bold text-forest text-sm bg-white rounded-lg border border-forest/10">{currentDate}</div>
                        <button onClick={() => changeDate(1)} className="p-2 border border-forest/10 rounded-lg hover:bg-forest/5"><ChevronRight className="w-4 h-4" /></button>
                     </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-100 italic font-serif">
                        <tr>
                          <th className="p-6">Identitas Siswa</th>
                          <th className="p-6">Zuhur (F/Q/B)</th>
                          <th className="p-6">Ashar (F/Q)</th>
                          <th className="p-6">Update Terakhir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {Array.from(new Set(entries.map(e => e.studentName))).map(name => {
                          const studentEntries = entries.filter(e => e.studentName === name && e.date === currentDate);
                          const studentInfo = entries.find(e => e.studentName === name);
                          const z = studentEntries.find(e => e.prayer === 'Zuhur');
                          const a = studentEntries.find(e => e.prayer === 'Ashar');
                          return (
                            <tr key={name} className="hover:bg-gray-50 transition-colors">
                              <td className="p-6">
                                <div className="font-bold text-forest text-lg font-serif italic">{name}</div>
                                <div className="text-[10px] uppercase font-bold tracking-widest text-ochre mt-1">Kelas {studentInfo?.studentClass || '-'}</div>
                              </td>
                              <td className="p-6">
                                <div className="flex gap-2">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${z?.fard ? 'bg-forest text-white' : 'bg-gray-100 text-gray-300'}`}>F</span>
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${z?.qobliyah ? 'bg-ochre text-white' : 'bg-gray-100 text-gray-300'}`}>Q</span>
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${z?.badiyah ? 'bg-ochre text-white' : 'bg-gray-100 text-gray-300'}`}>B</span>
                                </div>
                              </td>
                              <td className="p-6">
                                <div className="flex gap-2">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${a?.fard ? 'bg-forest text-white' : 'bg-gray-100 text-gray-300'}`}>F</span>
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${a?.qobliyah ? 'bg-ochre text-white' : 'bg-gray-100 text-gray-300'}`}>Q</span>
                                </div>
                              </td>
                              <td className="p-6 text-xs font-mono opacity-40">
                                {studentEntries.length ? new Date(Math.max(...studentEntries.map(e => e.timestamp))).toLocaleTimeString() : '-'}
                              </td>
                            </tr>
                          )
                        })}
                        {Array.from(new Set(entries.map(e => e.studentName))).length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-20 text-center italic opacity-30">Belum ada data masuk untuk tanggal ini</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-6xl mx-auto mt-16 pt-8 border-t border-forest/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.3em] opacity-40 text-center">
        <span>Integrated Muroqabah System</span>
        <div className="flex gap-4">
           <span>Monitor</span>
           <span>•</span>
           <span>Evaluasi</span>
           <span>•</span>
           <span>Motivasi</span>
        </div>
        <span>© {new Date().getFullYear()} School Portal</span>
      </footer>
    </div>
  );
}

