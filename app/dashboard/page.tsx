"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Shell from "@/components/Shell";
import { Calendar, ChevronRight, Clock, Users as UsersIcon, PieChart } from "lucide-react";
import { motion } from "framer-motion";

interface Session {
  id: string;
  date: string;
  display_name: string;
  type: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const q = query(collection(db, "sessions"), orderBy("date"));
      const snap = await getDocs(q);
      setSessions(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Session, "id">) }))
      );
      setFetching(false);
    }
    load();
  }, [user]);

  if (loading || fetching) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-slate-100 border-t-[#1a2b5e] rounded-full animate-spin" />
      </div>
    );
  }

  const monitorias = sessions.filter((s) => s.type.toLowerCase().includes("monitoria"));
  const intro = sessions.filter((s) => s.type.toLowerCase().includes("introducci"));

  function SessionGroup({ title, subtitle, items }: { title: string; subtitle: string; items: Session[] }) {
    return (
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
            <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
          </div>
          <div className="bg-[#1a2b5e]/5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-[#1a2b5e] uppercase tracking-wider">
            {items.length} Sesiones
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((s, idx) => {
            const date = new Date(s.date + "T00:00:00");
            const isPast = date < new Date();
            
            return (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => router.push(`/dashboard/attendance/${s.id}`)}
                className="glass rounded-[24px] p-6 text-left group hover:shadow-2xl hover:shadow-[#1a2b5e]/10 transition-all duration-300 relative overflow-hidden"
              >
                {/* Status Indicator */}
                <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl text-[9px] font-black uppercase tracking-widest ${
                  isPast ? "bg-slate-100 text-slate-500" : "bg-emerald-500 text-white"
                }`}>
                  {isPast ? "Finalizada" : "Próxima"}
                </div>

                <div className="w-12 h-12 rounded-2xl bg-[#1a2b5e]/5 flex items-center justify-center mb-5 group-hover:bg-[#1a2b5e] transition-colors">
                  <Calendar className="text-[#1a2b5e] group-hover:text-[#d4a017] transition-colors" size={24} />
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-[#1a2b5e] transition-colors">
                  {s.display_name}
                </h3>
                
                <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-6">
                  <Clock size={12} />
                  <span>Sábado</span>
                  <span className="mx-1">•</span>
                  <span>{s.date}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Continuar registro
                  </span>
                  <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-[#d4a017] group-hover:border-[#d4a017] transition-all">
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-[#1a2b5e]" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <Shell userEmail={user?.email}>
      {/* Welcome Header */}
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          Gestión de Sesiones
        </h1>
        <p className="text-slate-500 font-medium">
          Selecciona una fecha para registrar la asistencia de los monitores.
        </p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="glass shadow-sm rounded-[24px] p-6 border-l-4 border-[#1a2b5e]">
          <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mb-1">Total Sesiones</p>
          <p className="text-2xl font-black text-[#1a2b5e]">{sessions.length}</p>
        </div>
        <div className="glass shadow-sm rounded-[24px] p-6 border-l-4 border-emerald-500">
          <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mb-1">Próxima Sesión</p>
          <p className="text-2xl font-black text-[#1a2b5e]">
            {(() => {
              const next = sessions.find(s => new Date(s.date + "T00:00:00") >= new Date());
              if (!next) return "--";
              const d = new Date(next.date + "T00:00:00");
              return d.toLocaleDateString('es-ES', { month: 'long', day: 'numeric' });
            })()}
          </p>
        </div>
        <button 
          onClick={() => router.push('/dashboard/stats')}
          className="bg-[#1a2b5e] shadow-xl shadow-[#1a2b5e]/20 rounded-[24px] p-6 flex items-center justify-between text-white hover:scale-[1.02] active:scale-[0.98] transition-all group"
        >
          <div>
            <p className="text-white/60 text-[10px] uppercase font-black tracking-widest mb-1">Reportes</p>
            <p className="text-lg font-bold">Ver Analíticas</p>
          </div>
          <PieChart className="text-[#d4a017]" size={28} />
        </button>
      </div>

      <SessionGroup 
        title="Monitorias" 
        subtitle="Grados Noveno, Décimo y Once" 
        items={monitorias} 
      />
      
      <SessionGroup 
        title="Introducción al Semillero" 
        subtitle="Exclusivo Grado Once" 
        items={intro} 
      />
    </Shell>
  );
}
