/** Routeur (section 9.D — H1 à H10, S1/S2). */
import { createBrowserRouter, Navigate } from "react-router-dom";
import { DashboardLayout } from "./DashboardLayout";
import { useAuthStore } from "../features/auth/authStore";
import { LoginPage } from "../features/auth/LoginPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { AmbulancesPage } from "../features/ambulances/AmbulancesPage";
import { AmbulanceFormPage } from "../features/ambulances/AmbulanceFormPage";
import { DriversPage } from "../features/drivers/DriversPage";
import { DriverFormPage } from "../features/drivers/DriverFormPage";
import { TripsPage } from "../features/trips/TripsPage";
import { TripDetailPage } from "../features/trips/TripDetailPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { AdminsPage } from "../features/settings/AdminsPage";
import { HospitalsAdminPage } from "../features/admin/HospitalsAdminPage";
import { HospitalCreatePage } from "../features/admin/HospitalCreatePage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { accessToken, role } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  if (role === "PATIENT" || role === "AMBULANCIER") return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Garde de route par rôle (section 6 — RBAC aussi côté route). */
function RequireRole({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { role } = useAuthStore();
  if (!role || !roles.includes(role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "ambulances", element: <AmbulancesPage /> },
      { path: "ambulances/new", element: <AmbulanceFormPage /> },
      { path: "ambulances/:id/edit", element: <AmbulanceFormPage /> },
      { path: "drivers", element: <DriversPage /> },
      { path: "drivers/new", element: <DriverFormPage /> },
      { path: "drivers/:id/edit", element: <DriverFormPage /> },
      { path: "trips", element: <TripsPage /> },
      { path: "trips/:id", element: <TripDetailPage /> },
      { path: "settings", element: <SettingsPage /> },
      {
        path: "settings/admins",
        element: (
          <RequireRole roles={["ADMIN_HOSPITAL"]}>
            <AdminsPage />
          </RequireRole>
        ),
      },
      {
        path: "admin/hospitals",
        element: (
          <RequireRole roles={["SUPER_ADMIN"]}>
            <HospitalsAdminPage />
          </RequireRole>
        ),
      },
      {
        path: "admin/hospitals/new",
        element: (
          <RequireRole roles={["SUPER_ADMIN"]}>
            <HospitalCreatePage />
          </RequireRole>
        ),
      },
    ],
  },
]);
