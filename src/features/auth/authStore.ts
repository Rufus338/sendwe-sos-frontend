/** Store d'authentification (zustand + localStorage). */
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Role = "PATIENT" | "AMBULANCIER" | "ADMIN_HOSPITAL" | "SUPER_ADMIN";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  role: Role | null;
  userId: string | null;
  setTokens: (access: string, refresh: string) => void;
  setSession: (data: {
    access_token: string;
    refresh_token: string;
    role: Role;
    user_id: string;
  }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      role: null,
      userId: null,
      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      setSession: (data) =>
        set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          role: data.role,
          userId: data.user_id,
        }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, role: null, userId: null }),
    }),
    { name: "sendwe-auth" }
  )
);
