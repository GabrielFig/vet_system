import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, AuthClinic, Role } from '@vet/shared-types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  clinic: AuthClinic | null;
  role: Role | null;
  setAuth: (data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    clinic: AuthClinic;
    role: Role;
  }) => void;
  clearAuth: () => void;
  updateAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      clinic: null,
      role: null,
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
    }),
    { name: 'vet-auth' },
  ),
);
