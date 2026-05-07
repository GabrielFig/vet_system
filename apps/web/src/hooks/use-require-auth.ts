import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function useRequireAuth() {
  const router = useRouter();
  const { user, accessToken, role, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && !user) {
      router.replace('/login');
    }
  }, [_hasHydrated, user, router]);

  return { user, accessToken, role, ready: _hasHydrated };
}
