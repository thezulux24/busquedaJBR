import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, "serviceAccount.json"), "utf8")
);

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

// ─── DATOS ────────────────────────────────────────────────────────────────────

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
  { id: "ses_002", date: "2026-03-14", display_name: "14 de marzo de 2026",  type: "Monitorias noveno, décimo y once" },
  { id: "ses_003", date: "2026-03-21", display_name: "21 de marzo de 2026",  type: "Monitorias noveno, décimo y once" },
  { id: "ses_004", date: "2026-03-28", display_name: "28 de marzo de 2026",  type: "Monitorias noveno, décimo y once" },
  { id: "ses_005", date: "2026-04-18", display_name: "18 de abril de 2026",  type: "Monitorias noveno, décimo y once" },
  { id: "ses_006", date: "2026-04-25", display_name: "25 de abril de 2026",  type: "Monitorias noveno, décimo y once" },
  { id: "ses_007", date: "2026-05-02", display_name: "2 de mayo de 2026",    type: "Monitorias noveno, décimo y once" },
  { id: "ses_008", date: "2026-05-09", display_name: "9 de mayo de 2026",    type: "Monitorias noveno, décimo y once" },
];

// ─── SEED ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("\n🌱 Sincronizando Firestore con sesiones actualizadas...\n");

  console.log("📅 Actualizando sesiones...");
  
  // Limpiar sesión eliminada
  await db.collection("sessions").doc("ses_001").delete();
  console.log("  ✓ Sesión del 7 de marzo (ses_001) eliminada.");

  for (const s of SESSIONS) {
    await db.collection("sessions").doc(s.id).set({
      date: s.date,
      display_name: s.display_name,
      type: s.type,
    });
    console.log(`  ✓ ${s.display_name}`);
  }

  console.log("\n✅ Sincronización completada.\n");
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
