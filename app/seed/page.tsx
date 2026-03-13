"use client";
import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const STUDENTS = [
  { id: "std_001", name: "Joahn Camilo",         grade: 11 },
  { id: "std_002", name: "Jahdiel Molina",        grade: 11 },
  { id: "std_003", name: "Andrés Felipe Noscue",  grade: 11 },
  { id: "std_004", name: "Emily Ardila",           grade: 11 },
  { id: "std_005", name: "Esteban Reyes",          grade: 10 },
  { id: "std_006", name: "Santiago Noscué",        grade: 10 },
  { id: "std_007", name: "Santiago Fidel",         grade: 9  },
  { id: "std_008", name: "Isabel Posada",          grade: 9  },
  { id: "std_009", name: "Julián Meneses",         grade: 9  },
  { id: "std_010", name: "Emmanuel Rojas",         grade: 9  },
];

const SESSIONS = [
  { id: "ses_001", date: "2026-03-07", display_name: "7 de marzo de 2026",   type: "Monitorias noveno, décimo y once" },
  { id: "ses_002", date: "2026-03-14", display_name: "14 de marzo de 2026",  type: "Monitorias noveno, décimo y once" },
  { id: "ses_003", date: "2026-03-21", display_name: "21 de marzo de 2026",  type: "Monitorias noveno, décimo y once" },
  { id: "ses_004", date: "2026-03-28", display_name: "28 de marzo de 2026",  type: "Monitorias noveno, décimo y once" },
  { id: "ses_005", date: "2026-04-18", display_name: "18 de abril de 2026",  type: "Monitorias noveno, décimo y once" },
  { id: "ses_006", date: "2026-04-25", display_name: "25 de abril de 2026",  type: "Monitorias noveno, décimo y once" },
  { id: "ses_007", date: "2026-05-02", display_name: "2 de mayo de 2026",    type: "Monitorias noveno, décimo y once" },
  { id: "ses_008", date: "2026-05-09", display_name: "9 de mayo de 2026",    type: "Introducción al semillero grado once" },
  { id: "ses_009", date: "2026-05-16", display_name: "16 de mayo de 2026",   type: "Introducción al semillero grado once" },
];

type Status = "idle" | "loading" | "done" | "error";

export default function SeedPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [log, setLog] = useState<string[]>([]);

  function addLog(msg: string) {
    setLog((prev) => [...prev, msg]);
  }

  async function runSeed() {
    setStatus("loading");
    setLog([]);
    try {
      addLog("⏳ Cargando estudiantes...");
      for (const s of STUDENTS) {
        await setDoc(doc(db, "students", s.id), { name: s.name, grade: s.grade });
        addLog(`  ✓ ${s.name} (Grado ${s.grade})`);
      }

      addLog("⏳ Cargando sesiones...");
      for (const s of SESSIONS) {
        await setDoc(doc(db, "sessions", s.id), {
          date: s.date,
          display_name: s.display_name,
          type: s.type,
        });
        addLog(`  ✓ ${s.display_name}`);
      }

      addLog("✅ ¡Listo! Base de datos poblada correctamente.");
      setStatus("done");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog("❌ Error: " + msg);
      setStatus("error");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 14,
          boxShadow: "0 4px 16px rgba(26,43,94,.12)",
          padding: 28,
          maxWidth: 440,
          width: "100%",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: "2rem" }}>🗄️</div>
          <h1
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "#1a2b5e",
              margin: "8px 0 4px",
            }}
          >
            Seed de la Base de Datos
          </h1>
          <p style={{ fontSize: ".82rem", color: "#64748b" }}>
            Carga los estudiantes y sesiones en Firestore.
            <br />
            Ejecuta esto <strong>una sola vez</strong>.
          </p>
        </div>

        {status === "idle" && (
          <button
            id="seed-btn"
            onClick={runSeed}
            style={{
              width: "100%",
              padding: "13px",
              background: "#1a2b5e",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: ".95rem",
              cursor: "pointer",
            }}
          >
            Poblar base de datos
          </button>
        )}

        {status === "loading" && (
          <p style={{ textAlign: "center", color: "#64748b", fontSize: ".85rem" }}>
            Cargando datos…
          </p>
        )}

        {status === "done" && (
          <div
            style={{
              background: "#dcfce7",
              border: "1px solid #22c55e",
              borderRadius: 8,
              padding: "10px 14px",
              textAlign: "center",
              fontWeight: 600,
              color: "#15803d",
              fontSize: ".9rem",
            }}
          >
            ✅ Base de datos lista. Ya puedes ir a{" "}
            <a href="/dashboard" style={{ color: "#1a2b5e" }}>
              /dashboard
            </a>
          </div>
        )}

        {status === "error" && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #ef4444",
              borderRadius: 8,
              padding: "10px 14px",
              color: "#991b1b",
              fontSize: ".85rem",
            }}
          >
            Hubo un error. Revisa que el .env.local esté configurado y que estés autenticado.
          </div>
        )}

        {log.length > 0 && (
          <pre
            style={{
              marginTop: 16,
              background: "#0f172a",
              color: "#94a3b8",
              borderRadius: 8,
              padding: "12px 14px",
              fontSize: ".75rem",
              lineHeight: 1.7,
              maxHeight: 240,
              overflowY: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {log.join("\n")}
          </pre>
        )}
      </div>
    </div>
  );
}
