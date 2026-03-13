"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Shell from "@/components/Shell";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, Calendar, Award, ArrowUpRight, Download, FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";

interface Student {
  id: string;
  name: string;
  grade: number;
}

interface StudentStats {
  student: Student;
  total: number;
  present: number;
  late: number;
  absent: number;
  percentage: number;
}

interface TrendPoint {
  date: string;
  display: string;
  percentage: number;
}

interface SessionStat {
  id: string;
  display_name: string;
  date: string;
  grade_9: number;
  grade_10: number;
  grade_11: number;
}

export default function StatsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<StudentStats[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStat[]>([]);
  const [fetching, setFetching] = useState(true);
  const [totalSessions, setTotalSessions] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const stuSnap = await getDocs(collection(db, "students"));
      const students = stuSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Student, "id">) }));

      const sesSnap = await getDocs(query(collection(db, "sessions"), orderBy("date")));
      const totalSessionsData = sesSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const realizedSessions = totalSessionsData.filter(s => new Date(s.date) <= today);
      
      setTotalSessions(realizedSessions.length);
      const sessions = totalSessionsData;

      const attSnap = await getDocs(collection(db, "attendance"));
      const attData = attSnap.docs.map(d => d.data());

      // Load session metrics
      const metSnap = await getDocs(collection(db, "session_metrics"));
      const metData: Record<string, any> = {};
      metSnap.docs.forEach(d => { metData[d.id] = d.data(); });

      const sesStatsArr: SessionStat[] = sessions.map(s => ({
        id: s.id,
        display_name: s.display_name as string,
        date: s.date as string,
        grade_9: metData[s.id]?.grade_9 || 0,
        grade_10: metData[s.id]?.grade_10 || 0,
        grade_11: metData[s.id]?.grade_11 || 0,
      }));
      setSessionStats(sesStatsArr);

      // Trend data
      const trendPoints: TrendPoint[] = sessions.map(s => {
        const sessionAtt = attData.filter(a => a.session_id === s.id);
        const presentCnt = sessionAtt.filter(a => a.status === "present").length;
        const totalCnt = sessionAtt.length;
        return {
          date: s.date as string,
          display: (s.display_name as string).split(' ')[0],
          percentage: totalCnt > 0 ? Math.round((presentCnt / totalCnt) * 100) : 0
        };
      });
      setTrend(trendPoints);

      // Student Stats
      const statsArr = students.map(student => {
        const records = attData.filter(a => a.student_id === student.id);
        const present = records.filter(a => a.status === "present").length;
        const late = records.filter(a => a.status === "late").length;
        const total = records.length;
        const absent = records.filter(a => a.status === "absent").length;
        // % = (Presentes + Tardes) / Total
        const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
        return { student, total, present, late, absent, percentage };
      }).sort((a, b) => b.percentage - a.percentage);

      setStats(statsArr);
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const downloadExcel = () => {
    // Sheet 1: Individual Attendance
    const studentData = stats.map(s => ({
      "Nombre Estudiante": s.student.name,
      "Grado": s.student.grade,
      "Sesiones Totales": s.total,
      "Asistencias": s.present,
      "Llegadas Tarde": s.late,
      "Faltas": s.absent,
      "Porcentaje (%)": `${s.percentage}%`
    }));

    // Sheet 2: Session Attendees Count
    const sessionData = sessionStats.map(s => ({
      "Sesión": s.display_name,
      "Fecha": s.date,
      "Asistentes Grado 9": s.grade_9,
      "Asistentes Grado 10": s.grade_10,
      "Asistentes Grado 11": s.grade_11,
      "Total Asistentes": s.grade_9 + s.grade_10 + s.grade_11
    }));

    const wb = XLSX.utils.book_new();
    
    const ws1 = XLSX.utils.json_to_sheet(studentData);
    XLSX.utils.book_append_sheet(wb, ws1, "Resumen Monitores");
    
    const ws2 = XLSX.utils.json_to_sheet(sessionData);
    XLSX.utils.book_append_sheet(wb, ws2, "Asistencia por Sesión");
    
    XLSX.writeFile(wb, `Reporte_Semillero_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const overallPct = useMemo(() => {
    const totalPresent = stats.reduce((a, s) => a + s.present, 0);
    const totalPossible = stats.reduce((a, s) => a + s.total, 0);
    return totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;
  }, [stats]);

  const gradeAttendanceData = useMemo(() => {
    const g9 = sessionStats.reduce((a, s) => a + s.grade_9, 0);
    const g10 = sessionStats.reduce((a, s) => a + s.grade_10, 0);
    const g11 = sessionStats.reduce((a, s) => a + s.grade_11, 0);
    return [
      { grade: 'Grado 9°', count: g9, color: '#f59e0b' },
      { grade: 'Grado 10°', count: g10, color: '#2563eb' },
      { grade: 'Grado 11°', count: g11, color: '#4f46e5' },
    ];
  }, [sessionStats]);

  if (loading || fetching) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#1a2b5e] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Shell userEmail={user?.email}>
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Dashboard Analytics</h1>
          <p className="text-sm text-slate-500 font-medium">Análisis detallado de participación y permanencia.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={downloadExcel}
            className="flex items-center gap-2 bg-[#d4a017] text-[#1a2b5e] px-5 py-3 rounded-2xl shadow-xl shadow-[#d4a017]/10 font-black text-[12px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
          >
            <FileSpreadsheet size={18} /> Descargar Reporte
          </button>
        </div>
      </header>

      {/* Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
         {[
           { label: "Asistencia Global", val: `${overallPct}%`, icon: TrendingUp, color: "var(--primary)", bg: "bg-[#1a2b5e]/5" },
           { label: "Sesiones Realizadas", val: totalSessions, icon: Calendar, color: "#d4a017", bg: "bg-[#d4a017]/5" },
           { label: "Monitores Activos", val: stats.length, icon: Users, color: "#10b981", bg: "bg-emerald-500/5" },
         ].map((item, idx) => (
           <motion.div 
             key={item.label}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: idx * 0.1 }}
             className="glass rounded-[32px] p-8 flex items-center gap-6"
           >
             <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center`}>
               <item.icon style={{ color: item.color }} size={28} />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
               <p className="text-3xl font-black text-slate-900 leading-tight">{item.val}</p>
             </div>
           </motion.div>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
        {/* Trend Chart */}
        <div className="glass rounded-[32px] p-8 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-[#1a2b5e]" /> Histórico de Asistencia
            </h3>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a2b5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1a2b5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="display" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '16px' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1a2b5e', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#1a2b5e" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorPct)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade attendance Chart */}
        <div className="glass rounded-[32px] p-8 shadow-sm">
           <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-8">
             <Users size={20} className="text-[#1a2b5e]" /> Asistencia por Grado
           </h3>
           <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold', fill: '#64748b'}} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '16px' }}
                />
                <Bar dataKey="count" radius={[12, 12, 12, 12]} barSize={50}>
                  {gradeAttendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>

        {/* Ranking */}
        <div className="glass rounded-[32px] p-8 shadow-sm">
           <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-8">
             <Award size={20} className="text-[#d4a017]" /> Mejores Monitores
           </h3>
           <div className="space-y-6">
             {stats.slice(0, 5).map((s, idx) => (
                <div key={s.student.id} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] ${
                    idx === 0 ? "bg-[#d4a017] text-white" : "bg-slate-50 text-slate-400"
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-sm font-bold text-slate-700">{s.student.name}</p>
                      <span className="text-xs font-black text-[#1a2b5e] font-mono">{s.percentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${s.percentage}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-[#1a2b5e] to-[#2e448b] rounded-full"
                      />
                    </div>
                  </div>
                </div>
             ))}
           </div>
        </div>
      </div>

      {/* Full Student Table */}
      <div className="glass rounded-[32px] p-8 shadow-sm overflow-hidden mb-10 border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-bold text-slate-800">Detalle Individual</h3>
          <div className="flex gap-2">
            {[11, 10, 9].map(g => (
              <span key={g} className="text-[9px] font-black px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 uppercase tracking-tighter">Grado {g}</span>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="pb-4 text-[10px] uppercase font-black tracking-widest text-slate-400/60 pl-2">Estudiante</th>
                <th className="pb-4 text-[10px] uppercase font-black tracking-widest text-slate-400/60">Grado</th>
                <th className="pb-4 text-[10px] uppercase font-black tracking-widest text-slate-400/60 text-center">Asist.</th>
                <th className="pb-4 text-[10px] uppercase font-black tracking-widest text-slate-400/60 text-center">Tardes</th>
                <th className="pb-4 text-[10px] uppercase font-black tracking-widest text-slate-400/60 text-center">Inasist.</th>
                <th className="pb-4 text-right text-[10px] uppercase font-black tracking-widest text-slate-400/60 pr-2">Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50">
              {stats.map((s) => (
                <tr key={s.student.id} className="group hover:bg-[#1a2b5e]/[0.02] transition-colors">
                  <td className="py-4 font-bold text-slate-700 text-sm pl-2">{s.student.name}</td>
                  <td className="py-4">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                      s.student.grade === 11 ? 'bg-indigo-50 text-indigo-600' :
                      s.student.grade === 10 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {s.student.grade}°
                    </span>
                  </td>
                  <td className="py-4 text-sm font-black text-emerald-600 text-center">{s.present}</td>
                  <td className="py-4 text-sm font-black text-amber-600 text-center">{s.late}</td>
                  <td className="py-4 text-sm font-black text-red-400 text-center">{s.absent}</td>
                  <td className="py-4 text-right pr-2">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block shadow-inner">
                        <div className="h-full bg-[#d4a017]" style={{ width: `${s.percentage}%` }} />
                      </div>
                      <span className="text-sm font-black text-slate-900 font-mono">{s.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
