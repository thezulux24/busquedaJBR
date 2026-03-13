"use client";
import { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Users, PieChart, LogOut, ChevronRight } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";

interface ShellProps {
  children: ReactNode;
  userEmail?: string | null;
}

export default function Shell({ children, userEmail }: ShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { name: "Sesiones", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Estadísticas", icon: PieChart, path: "/dashboard/stats" },
  ];

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-[280px] h-screen sticky top-0 bg-[#1a2b5e] text-white p-8">
        <div className="mb-12">
          <div className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            <span className="text-[#d4a017]">📐</span> Semillero
          </div>
          <div className="text-[10px] uppercase tracking-[2px] opacity-60 font-bold mt-1">
            Gestión de Asistencia
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "bg-white/10 text-white shadow-lg" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={20} className={isActive ? "text-[#d4a017]" : "group-hover:text-white"} />
                <span className="font-semibold text-sm">{item.name}</span>
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-8 border-t border-white/10">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg">
              👨‍🏫
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{userEmail || "Profesor"}</p>
              <p className="text-[10px] text-white/40 uppercase font-medium">Administrador</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/10 transition-all font-semibold text-sm"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-18 bg-white/80 backdrop-blur-xl border border-white/40 z-[100] px-6 flex items-center justify-around rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] pb-env(safe-area-inset-bottom)">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center justify-center transition-all active:scale-90"
            >
              <div className={`p-2 rounded-xl transition-all ${isActive ? "bg-[#1a2b5e] text-[#d4a017] shadow-lg shadow-[#1a2b5e]/20" : "text-slate-400"}`}>
                <item.icon size={22} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${isActive ? "text-[#1a2b5e]" : "text-slate-400"}`}>
                {item.name}
              </span>
            </button>
          );
        })}
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center justify-center active:scale-90"
        >
          <div className="p-2 text-red-500">
            <LogOut size={22} />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest mt-1 text-red-500">
            Salir
          </span>
        </button>
      </nav>
    </div>
  );
}
