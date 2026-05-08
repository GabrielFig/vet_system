import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, AuthClinic, Role } from '@vet/shared-types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  clinic: AuthClinic | null;
  role: Role | null;
  modules: string[];
  isSuperAdmin: boolean;
  _hasHydrated: boolean;
  setAuth: (data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    clinic: AuthClinic;
    role: Role;
  }) => void;
  clearAuth: () => void;
  updateAccessToken: (token: string) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  setHasHydrated: (v: boolean) => void;
}

function decodeJwtModules(token: string): { modules: string[]; isSuperAdmin: boolean } {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { modules: payload.modules ?? [], isSuperAdmin: payload.isSuperAdmin ?? false };
  } catch {
    return { modules: [], isSuperAdmin: false };
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      clinic: null,
      role: null,
      modules: [],
      isSuperAdmin: false,
      _hasHydrated: false,
      setAuth: (data) => {
        const { modules, isSuperAdmin } = decodeJwtModules(data.accessToken);
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
          clinic: data.clinic,
          role: data.role,
          modules,
          isSuperAdmin,
        });
      },
      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, user: null, clinic: null, role: null, modules: [], isSuperAdmin: false }),
      updateAccessToken: (token) => {
        const { modules, isSuperAdmin } = decodeJwtModules(token);
        set({ accessToken: token, modules, isSuperAdmin });
      },
      updateTokens: (accessToken, refreshToken) => {
        const { modules, isSuperAdmin } = decodeJwtModules(accessToken);
        set({ accessToken, refreshToken, modules, isSuperAdmin });
      },
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'vet-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
