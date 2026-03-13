"use client";
import { useState, FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Calculator } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch {
      setError("Credenciales no válidas. Revisa tus datos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-[#0f172a]">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1e40af] blur-[120px] opacity-20 rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#d4a017] blur-[120px] opacity-10 rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="glass p-8 md:p-10 rounded-[32px] border-white/5 shadow-2xl relative">
          <div className="mb-10 text-center">
            <motion.div 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="w-16 h-16 bg-gradient-to-tr from-[#1a2b5e] to-[#2e448b] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl"
            >
              <Calculator className="text-[#d4a017]" size={32} />
            </motion.div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Bienvenido <br />
              al Semillero
            </h1>
            <p className="text-slate-400 mt-2 text-sm font-medium uppercase tracking-widest">
              Escuela de Líderes JBR
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">
                Correo Institucional
              </label>
              <div className="relative group">
                <input
                  type="email"
                  placeholder="profesor@colegio.edu"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none focus:border-[#d4a017]/50 focus:bg-white/10 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#d4a017] transition-colors" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">
                Contraseña
              </label>
              <div className="relative group">
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none focus:border-[#d4a017]/50 focus:bg-white/10 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#d4a017] transition-colors" size={20} />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl text-center font-semibold"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d4a017] hover:bg-[#f0c040] text-[#1a2b5e] font-bold py-4 rounded-2xl shadow-lg shadow-[#d4a017]/10 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#1a2b5e]/30 border-t-[#1a2b5e] rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Acceder al Portal</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-slate-500 text-xs font-medium">
            &copy; {new Date().getFullYear()} Escuela John Boris Rincón
          </p>
        </div>
      </motion.div>
    </div>
  );
}
