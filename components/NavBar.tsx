"use client";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface NavBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
}

export default function NavBar({
  title,
  subtitle,
  showBack = false,
  backHref = "/dashboard",
}: NavBarProps) {
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <nav className="navbar">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {showBack && (
          <button
            id="back-btn"
            className="navbar-btn"
            style={{ padding: "8px 10px", marginRight: 2 }}
            onClick={() => router.push(backHref)}
            aria-label="Volver"
          >
            ←
          </button>
        )}
        <div>
          <div className="navbar-title">{title}</div>
          {subtitle && <div className="navbar-subtitle">{subtitle}</div>}
        </div>
      </div>

      {!showBack && (
        <button id="logout-btn" className="navbar-btn" onClick={handleLogout}>
          Salir
        </button>
      )}
    </nav>
  );
}
