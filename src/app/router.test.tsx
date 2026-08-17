// Tests frontend — section 26 : garde de route par rôle (RBAC côté route).
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Outlet } from "react-router-dom";
import { RequireAuth, RequireRole } from "../app/router";
import { useAuthStore } from "../features/auth/authStore";

const Protected = () => <div>Contenu protégé</div>;
const AdminOnly = () => <div>Espace admin</div>;
const SuperAdminOnly = () => <div>Espace super admin</div>;
const Login = () => <div>Page de connexion</div>;
const Dashboard = () => <div>Dashboard</div>;

// Layout parent équivalent au DashboardLayout : rend un <Outlet/> pour les routes imbriquées.
const Layout = () => (
  <RequireAuth>
    <Protected />
    <Outlet />
  </RequireAuth>
);

function renderApp(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Layout />}>
          <Route
            path="settings/admins"
            element={
              <RequireRole roles={["ADMIN_HOSPITAL"]}>
                <AdminOnly />
              </RequireRole>
            }
          />
          <Route
            path="admin/hospitals"
            element={
              <RequireRole roles={["SUPER_ADMIN"]}>
                <SuperAdminOnly />
              </RequireRole>
            }
          />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  useAuthStore.getState().logout();
  localStorage.clear();
});

describe("Garde de route par rôle (section 26 — navigation)", () => {
  it("redirige vers /login si non authentifié", () => {
    renderApp();
    expect(screen.getByText("Page de connexion")).toBeInTheDocument();
  });

  it("laisse passer un admin hôpital authentifié", () => {
    useAuthStore.getState().setSession({
      access_token: "t",
      refresh_token: "r",
      role: "ADMIN_HOSPITAL",
      user_id: "1",
    });
    renderApp();
    expect(screen.getByText("Contenu protégé")).toBeInTheDocument();
  });

  it("refuse l'accès dashboard aux rôles PATIENT et AMBULANCIER (redirige /login)", () => {
    useAuthStore.getState().setSession({
      access_token: "t",
      refresh_token: "r",
      role: "PATIENT",
      user_id: "1",
    });
    renderApp();
    expect(screen.getByText("Page de connexion")).toBeInTheDocument();
  });

  it("refuse /settings/admins à un SUPER_ADMIN (redirige /dashboard)", () => {
    useAuthStore.getState().setSession({
      access_token: "t",
      refresh_token: "r",
      role: "SUPER_ADMIN",
      user_id: "1",
    });
    renderApp("/settings/admins");
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Espace admin")).not.toBeInTheDocument();
  });

  it("autorise /admin/hospitals uniquement pour un SUPER_ADMIN", () => {
    useAuthStore.getState().setSession({
      access_token: "t",
      refresh_token: "r",
      role: "SUPER_ADMIN",
      user_id: "1",
    });
    renderApp("/admin/hospitals");
    expect(screen.getByText("Espace super admin")).toBeInTheDocument();
  });

  it("refuse /admin/hospitals à un ADMIN_HOSPITAL", () => {
    useAuthStore.getState().setSession({
      access_token: "t",
      refresh_token: "r",
      role: "ADMIN_HOSPITAL",
      user_id: "1",
    });
    renderApp("/admin/hospitals");
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Espace super admin")).not.toBeInTheDocument();
  });
});
