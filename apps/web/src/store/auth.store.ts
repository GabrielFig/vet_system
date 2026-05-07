import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, AuthClinic, Role } from '@vet/shared-types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  clinic: AuthClinic | null;
  role: Role | null;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      clinic: null,
      role: null,
      _hasHydrated: false,
      setAuth: (data) =>
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
          clinic: data.clinic,
          role: data.role,
        }),
      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, user: null, clinic: null, role: null }),
      updateAccessToken: (token) => set({ accessToken: token }),
      updateTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
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
