"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  FileSpreadsheet, 
  FileText, 
  FileCode, 
  Download, 
  Filter, 
  Settings2, 
  Activity, 
  Car, 
  Bike, 
  Truck, 
  Bus as BusIcon,
  Trash2,
  ChevronDown,
  LayoutDashboard,
  Trophy
} from 'lucide-react';
import TrafficCounter from '@/components/TrafficCounter';
import { exportToExcel, exportToPDF, exportToWord } from '@/lib/exportUtils';
import { VehicleType, DetectionResult } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

const vehicleIcons: Record<string, any> = {
  car: Car,
  motorcycle: Bike,
  truck: Truck,
  bus: BusIcon,
};

const colors = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
];

export default function Home() {
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [activeCategories, setActiveCategories] = useState<VehicleType[]>(['car', 'motorcycle', 'truck', 'bus']);
  const [isExporting, setIsExporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleVehicleDetection = useCallback((vehicle: any) => {
    // Simple stabilization: don't count the same type within 2 seconds
    setDetections(prev => {
      const recent = prev.find(d => d.type === vehicle.type && Date.now() - d.timestamp < 2000);
      if (recent) return prev;
      return [...prev, vehicle];
    });
  }, []);

  const stats = useMemo(() => {
    const counts: Record<VehicleType, number> = {
      car: 0,
      motorcycle: 0,
      truck: 0,
      bus: 0,
    };
    detections.forEach(d => {
      if (counts[d.type] !== undefined) {
        counts[d.type]++;
      }
    });

    const chartData = activeCategories.map(cat => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      count: counts[cat],
      color: colors[activeCategories.indexOf(cat) % colors.length]
    }));

    return { counts, chartData, total: detections.length };
  }, [detections, activeCategories]);

  const toggleCategory = (cat: VehicleType) => {
    setActiveCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const clearHistory = () => {
    if (confirm("Hapus semua data perhitungan?")) {
      setDetections([]);
    }
  };

  const handleExport = (format: 'excel' | 'pdf' | 'word') => {
    const data = detections.map(d => ({
      ID: d.id,
      Jenis: d.type.toUpperCase(),
      Waktu: new Date(d.timestamp).toLocaleTimeString(),
      Tanggal: new Date(d.timestamp).toLocaleDateString(),
      Akurasi: `${Math.round(d.confidence * 100)}%`
    }));

    const title = "Laporan Perhitungan Arus Lalu Lintas AI";
    const fileName = `Laporan_Traffic_${new Date().toISOString().split('T')[0]}`;

    if (format === 'excel') exportToExcel(data, fileName);
    if (format === 'pdf') exportToPDF(data, title, fileName);
    if (format === 'word') exportToWord(data, title, fileName);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pb-20 overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]"></div>
      </div>

      <header className="sticky top-0 z-50 p-4 sm:p-6 backdrop-blur-2xl bg-slate-950/70 border-b border-slate-800/60 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="relative p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/40 border border-blue-400/30">
              <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
              <Activity className="w-6 h-6 text-white relative z-10" />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-white via-blue-100 to-slate-400 bg-clip-text text-transparent">SMARTRAFFIC</h1>
              <p className="text-[10px] text-blue-400 font-bold tracking-[0.2em] uppercase">AI Vision Engine</p>
            </div>
          </motion.div>
          
          <motion.button 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 bg-slate-800/80 hover:bg-slate-700/80 rounded-2xl transition-all border border-slate-700 shadow-xl"
          >
            <Settings2 className="w-5 h-5 text-slate-300" />
          </motion.button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        
        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Camera Section */}
          <div className="space-y-6">
            <TrafficCounter 
              onVehicleDetected={handleVehicleDetection} 
              activeCategories={activeCategories} 
            />
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['car', 'motorcycle', 'truck', 'bus'].map((cat) => {
                const Icon = vehicleIcons[cat];
                const isActive = activeCategories.includes(cat as VehicleType);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat as VehicleType)}
                    className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all active:scale-95 ${
                      isActive 
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-lg shadow-blue-500/10' 
                      : 'bg-slate-900/50 border-slate-800 text-slate-500'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <span className="text-xs font-bold uppercase tracking-tight">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Statistics Section */}
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl relative group overflow-hidden"
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                <div className="absolute top-4 right-4 p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <p className="text-slate-400 text-sm font-bold mb-2">Total Terdeteksi</p>
                <h2 className="text-5xl font-black text-white tracking-tighter">{stats.total}</h2>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-lg border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
                  LIVE SYNC
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl relative group overflow-hidden"
              >
                 <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
                 <div className="absolute top-4 right-4 p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                  <Trophy className="w-6 h-6" />
                </div>
                <p className="text-slate-400 text-sm font-bold mb-2">Dominasi Arus</p>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight mt-2">
                  {stats.total > 0 ? Object.entries(stats.counts).sort((a,b) => b[1] - a[1])[0][0] : '-'}
                </h2>
                <div className="mt-4 flex">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">KENDARAAN TERBANYAK</span>
                </div>
              </motion.div>
            </div>

            {/* Chart Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-lg tracking-tight flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <Activity className="w-4 h-4 text-blue-400" />
                  </div>
                  Statistik Volume
                </h3>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.5} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748b" 
                      fontSize={11} 
                      fontWeight="bold"
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={11} 
                      fontWeight="bold"
                      axisLine={false}
                      tickLine={false}
                      dx={-10}
                    />
                    <Tooltip 
                      cursor={{ fill: '#1e293b', opacity: 0.4 }}
                      contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                        backdropFilter: 'blur(8px)',
                        border: '1px solid #334155', 
                        borderRadius: '16px',
                        padding: '12px 16px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      radius={[8, 8, 0, 0]}
                      maxBarSize={40}
                    >
                      {stats.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Export and History Controls */}
        <div className="p-6 bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800/50 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-black mb-1">Simpan Hasil Laporan</h3>
              <p className="text-slate-500 text-sm">Unduh data pergerakan dalam format pilihan Anda</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button 
                onClick={() => handleExport('excel')}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                <FileSpreadsheet className="w-5 h-5" />
                EXCEL
              </button>
              <button 
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-rose-500/20"
              >
                <FileText className="w-5 h-5" />
                PDF
              </button>
              <button 
                onClick={() => handleExport('word')}
                className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/20"
              >
                <FileCode className="w-5 h-5" />
                WORD
              </button>
              
              <div className="w-[1px] h-10 bg-slate-700 hidden sm:block mx-2"></div>
              
              <button 
                onClick={clearHistory}
                className="p-4 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-2xl transition-all border border-slate-700"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-slate-800/50 shadow-xl overflow-hidden pb-4">
          <table className="w-full text-left">
            <thead className="border-b border-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Jenis</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Waktu Terdeteksi</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Tingkat Akurasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {detections.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center text-slate-500 font-medium">
                    Belum ada data kendaraan yang terdeteksi
                  </td>
                </tr>
              ) : (
                detections.slice(-8).reverse().map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
                            {React.createElement(vehicleIcons[d.type] || Car, { className: "w-4 h-4" })}
                         </div>
                         <span className="font-bold uppercase text-xs">{d.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-medium text-slate-400">
                      {new Date(d.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-2 py-1 bg-slate-800 text-[10px] font-bold rounded-lg text-slate-300">
                        {Math.round(d.confidence * 100)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Floating Category Filter for Mobile */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 z-50 p-6 bg-slate-900 border-t border-slate-800 rounded-t-[40px] shadow-2xl"
          >
            <div className="max-w-md mx-auto">
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-8"></div>
              <h4 className="text-xl font-black mb-6">Pengaturan Radar AI</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl">
                   <div>
                      <p className="font-bold">Sensitivitas Deteksi</p>
                      <p className="text-xs text-slate-500">Akurasi minimum untuk counting</p>
                   </div>
                   <span className="px-3 py-1 bg-blue-600 text-xs font-bold rounded-xl">0.60 (High)</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl">
                   <div>
                      <p className="font-bold">Auto-Stabilizer</p>
                      <p className="text-xs text-slate-500">Mencegah double-counting objek</p>
                   </div>
                   <div className="w-12 h-6 bg-emerald-600 rounded-full relative p-1 cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full absolute right-1"></div>
                   </div>
                </div>
              </div>

              <button 
                onClick={() => setShowSettings(false)}
                className="w-full mt-8 py-4 bg-white text-slate-950 font-black rounded-2xl active:scale-95 transition-all"
              >
                SIMPAN & LANJUTKAN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
