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

async function cleanup() {
  console.log("🧹 Eliminando sesiones no deseadas de mayo 2026...");
  
  const toDelete = ["ses_008", "ses_009"];
  
  for (const id of toDelete) {
    await db.collection("sessions").doc(id).delete();
    console.log(`  ✓ Sesión ${id} eliminada.`);
  }

  console.log("\n✅ Limpieza completada.");
  process.exit(0);
}

cleanup().catch(e => {
  console.error("❌ Error:", e);
  process.exit(1);
});
