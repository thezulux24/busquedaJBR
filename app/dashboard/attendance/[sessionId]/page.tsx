"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Shell from "@/components/Shell";
import { Check, X, Users, ClipboardCheck, ArrowLeft, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Student {
  id: string;
  name: string;
  grade: number;
}

interface AttendanceRecord {
  [studentId: string]: "present" | "absent" | "late" | null;
}

interface Session {
  id: string;
  date: string;
  display_name: string;
  type: string;
}

export default function AttendancePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord>({});
  const [gradeCounts, setGradeCounts] = useState<Record<number, number>>({ 9: 0, 10: 0, 11: 0 });
  const [saving, setSaving] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const load = useCallback(async () => {
    if (!user || !sessionId) return;
    try {
      const sesSnap = await getDoc(doc(db, "sessions", sessionId));
      if (sesSnap.exists()) {
        setSession({ id: sesSnap.id, ...(sesSnap.data() as Omit<Session, "id">) });
      }

      // Load session metrics (counts)
      const metSnap = await getDoc(doc(db, "session_metrics", sessionId));
      if (metSnap.exists()) {
        const data = metSnap.data();
        setGradeCounts({
          9: data.grade_9 || 0,
          10: data.grade_10 || 0,
          11: data.grade_11 || 0,
        });
      }

      const stuSnap = await getDocs(query(collection(db, "students"), where("grade", "!=", null)));
      const stuList = stuSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Student, "id">) }))
        .sort((a, b) => b.grade - a.grade || a.name.localeCompare(b.name));
      setStudents(stuList);

      const attSnap = await getDocs(query(collection(db, "attendance"), where("session_id", "==", sessionId)));
      const rec: AttendanceRecord = {};
      attSnap.docs.forEach((d) => {
        const data = d.data();
        rec[data.student_id] = data.status;
      });
      setAttendance(rec);
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  }, [user, sessionId]);

  useEffect(() => { load(); }, [load]);

  async function updateGradeCount(grade: number, value: number) {
    const newVal = Math.max(0, value);
    setGradeCounts(prev => ({ ...prev, [grade]: newVal }));
    try {
      await setDoc(doc(db, "session_metrics", sessionId), {
        [`grade_${grade}`]: newVal,
        updated_at: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  }

  async function markAttendance(studentId: string, status: "present" | "absent" | "late") {
    if (saving) return;
    setSaving(studentId);
    try {
      const docId = `${sessionId}_${studentId}`;
      await setDoc(doc(db, "attendance", docId), {
        session_id: sessionId,
        student_id: studentId,
        status,
        timestamp: serverTimestamp(),
      });
      setAttendance((prev) => ({ ...prev, [studentId]: status }));
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  }

  if (loading || fetching) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <RefreshCw className="text-[#1a2b5e] animate-spin" size={32} />
      </div>
    );
  }

  const grades = [11, 10, 9];
  const isIntro = session?.type.toLowerCase().includes("introducci");
  const filteredGrades = isIntro ? [11] : grades;
  
  const markedCount = Object.values(attendance).filter(Boolean).length;
  const presentCount = Object.values(attendance).filter((v) => v === "present").length;
  const totalRelevantStudents = isIntro ? students.filter(s => s.grade === 11).length : students.length;
  const progress = Math.round((markedCount / totalRelevantStudents) * 100) || 0;

  return (
    <Shell userEmail={user?.email}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-4 hover:text-[#1a2b5e] transition-colors"
          >
            <ArrowLeft size={14} /> Volver a sesiones
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight mb-2">
            {session?.display_name}
          </h1>
          <div className="flex items-center gap-3">
            <span className="bg-[#1a2b5e]/5 text-[#1a2b5e] text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider">
              {session?.type}
            </span>
            {isIntro && (
              <span className="bg-[#d4a017]/10 text-[#d4a017] text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border border-[#d4a017]/20 shadow-sm animate-pulse">
                Filtro: Solo Grado 11
              </span>
            )}
          </div>
        </div>

        {/* Global Progress Card */}
        <div className="glass bg-[#1a2b5e] text-white p-6 rounded-[28px] shadow-2xl flex items-center gap-6 min-w-[280px]">
          <div className="relative w-16 h-16 flex items-center justify-center">
             <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="transparent" />
                <circle 
                  cx="32" cy="32" r="28" stroke="#d4a017" strokeWidth="6" fill="transparent" 
                  strokeDasharray={175.9}
                  strokeDashoffset={175.9 - (175.9 * progress) / 100}
                  className="transition-all duration-700 ease-out"
                />
             </svg>
             <span className="text-xs font-black">{progress}%</span>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Progreso Sesión</div>
            <div className="text-xl font-black">{markedCount} <span className="text-white/40 text-sm">/ {totalRelevantStudents}</span></div>
            <div className="text-[11px] font-bold text-[#d4a017]">{presentCount} Presentes hoy</div>
          </div>
        </div>
      </div>

      {/* Grade Counts Metrics Section */}
      <div className="glass rounded-[32px] p-8 mb-12 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#d4a017]/10 flex items-center justify-center text-[#d4a017]">
            <Users size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Total Estudiantes Asistentes</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Registrar cantidad por cada grado (Adicional a monitores)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[11, 10, 9].map((g) => (
            <div key={g} className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Grado {g}°</label>
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <input
                  type="number"
                  min="0"
                  value={gradeCounts[g] || 0}
                  onChange={(e) => updateGradeCount(g, parseInt(e.target.value) || 0)}
                  className="w-full bg-transparent text-center font-black text-xl text-[#1a2b5e] outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid of Grades */}
      <div className="space-y-12">
        {filteredGrades.map((grade) => {
          const gradeStudents = students.filter((s) => s.grade === grade);
          if (gradeStudents.length === 0) return null;

          return (
            <section key={grade}>
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${
                  grade === 11 ? "bg-indigo-100 text-indigo-600" :
                  grade === 10 ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
                }`}>
                  {grade}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 tracking-tight">Grado {grade}°</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{gradeStudents.length} Monitores</p>
                </div>
                <div className="flex-1 h-[1px] bg-slate-100" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {gradeStudents.map((s) => {
                  const status = attendance[s.id];
                  const isSaving = saving === s.id;

                  return (
                    <motion.div
                      layout
                      key={s.id}
                      className={`glass p-5 rounded-[24px] transition-all relative overflow-hidden ${
                        status === "present" ? "border-emerald-500/20 bg-emerald-500/[0.02]" :
                        status === "absent" ? "border-red-500/20 bg-red-500/[0.02]" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl shadow-inner">
                            👤
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800">{s.name}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estudiante Monitor</p>
                          </div>
                        </div>
                        <AnimatePresence>
                          {status && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg ${
                                status === "present" ? "bg-emerald-500 text-white" : 
                                status === "late" ? "bg-amber-500 text-white" : "bg-red-500 text-white"
                              }`}
                            >
                              {status === "present" ? "Presente" : status === "late" ? "Tarde" : "Ausente"}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => markAttendance(s.id, "present")}
                          disabled={isSaving}
                          className={`flex-1 group py-3 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
                            status === "present" 
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                              : "bg-slate-50 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-500 border-2 border-transparent"
                          }`}
                        >
                          <Check size={18} strokeWidth={3} className={isSaving && status === "present" ? "animate-spin" : ""} />
                        </button>
                        <button
                          onClick={() => markAttendance(s.id, "late")}
                          disabled={isSaving}
                          className={`flex-1 group py-3 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
                            status === "late" 
                              ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" 
                              : "bg-slate-50 text-slate-400 hover:bg-amber-500/10 hover:text-amber-500 border-2 border-transparent"
                          }`}
                        >
                          <RefreshCw size={18} strokeWidth={3} className={isSaving && status === "late" ? "animate-spin" : ""} />
                        </button>
                        <button
                          onClick={() => markAttendance(s.id, "absent")}
                          disabled={isSaving}
                          className={`flex-1 group py-3 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
                            status === "absent" 
                              ? "bg-red-500 text-white shadow-lg shadow-red-500/20" 
                              : "bg-slate-50 text-slate-400 hover:bg-red-500/10 hover:text-red-500 border-2 border-transparent"
                          }`}
                        >
                          <X size={18} strokeWidth={3} className={isSaving && status === "absent" ? "animate-spin" : ""} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Persistent Footer Progress for Mobile */}
      <div className="md:hidden fixed bottom-24 left-6 right-6 z-50">
        <div className="bg-[#1a2b5e] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10">
          <div className="flex items-center gap-3">
             <ClipboardCheck className="text-[#d4a017]" size={20} />
             <span className="text-xs font-bold uppercase tracking-widest">Resumen</span>
          </div>
          <div className="text-sm font-black">{markedCount}/{students.length} marcados</div>
        </div>
      </div>
    </Shell>
  );
}
