/** Layout avec sidebar fixe (section 11 — navigation). */
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../features/auth/authStore";
import { api } from "../lib/api";
import { NetworkBanner } from "../shared/ui";
import { WSClient } from "../lib/ws";
import { useEffect, useRef, useState } from "react";

const NAV = [
  { to: "/dashboard", label: "Tableau de bord", icon: "📊" },
  { to: "/ambulances", label: "Ambulances", icon: "🚑" },
  { to: "/drivers", label: "Ambulanciers", icon: "👤" },
  { to: "/trips", label: "Interventions", icon: "🚨" },
  { to: "/settings", label: "Paramètres", icon: "⚙️" },
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const { role, logout } = useAuthStore();
  const [wsOnline, setWsOnline] = useState(true);
  const wsRef = useRef<WSClient | null>(null);

  useEffect(() => {
    const ws = new WSClient({
      onStatusChange: (connected) => {
        setWsOnline(connected);
        window.dispatchEvent(new CustomEvent("ws:status", { detail: { connected } }));
      },
      // Resynchronisation REST à la reconnexion (section 16.1)
      onReconnect: () => {
        window.dispatchEvent(new CustomEvent("ws:reconnect"));
      },
      handlers: {
        "ambulance.location.updated": () => window.dispatchEvent(new CustomEvent("ws:ambulance")),
        "emergency.status.updated": () => window.dispatchEvent(new CustomEvent("ws:trip")),
        "emergency.assigned": () => window.dispatchEvent(new CustomEvent("ws:trip")),
        "emergency.failed": () => window.dispatchEvent(new CustomEvent("ws:trip")),
      },
    });
    wsRef.current = ws;
    ws.connect();
    return () => ws.close();
  }, []);

  const handleLogout = async () => {
    const { refreshToken } = useAuthStore.getState();
    try {
      if (refreshToken) await api("/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) });
    } catch {
      /* ignore */
    }
    logout();
    navigate("/login");
  };

  const isSuper = role === "SUPER_ADMIN";

  return (
    <div className="flex h-full">
      <aside className="flex w-60 flex-col border-r border-border bg-white">
        <div className="border-b border-border px-5 py-6">
          <h1 className="text-xl font-bold text-foreground">Sendwe SOS</h1>
          <p className="mt-1 text-xs font-medium text-muted-foreground">Dashboard hôpital</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary text-on-primary"
                    : "text-foreground hover:bg-muted"
                }`
              }
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          {isSuper && (
            <NavLink
              to="/admin/hospitals"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary text-on-primary"
                    : "text-foreground hover:bg-muted"
                }`
              }
            >
              <span aria-hidden="true">🏥</span>
              Hôpitaux (super admin)
            </NavLink>
          )}
        </nav>
        <div className="border-t border-border p-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-control px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors duration-200 cursor-pointer hover:bg-muted hover:text-foreground"
          >
            Se déconnecter
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-background">
        <NetworkBanner visible={!wsOnline} />
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
