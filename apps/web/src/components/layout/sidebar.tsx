'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function PawIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="4" r="2"/>
      <circle cx="18" cy="8" r="2"/>
      <circle cx="20" cy="16" r="2"/>
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
      <line x1="16" x2="16" y1="2" y2="6"/>
      <line x1="8" x2="8" y1="2" y2="6"/>
      <line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
      <polyline points="3.29 7 12 12 20.71 7"/>
      <line x1="12" x2="12" y1="22" y2="12"/>
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" x2="18" y1="20" y2="10"/>
      <line x1="12" x2="12" y1="20" y2="4"/>
      <line x1="6" x2="6" y1="20" y2="14"/>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" x2="9" y1="12" y2="12"/>
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12"/>
      <line x1="4" x2="20" y1="6" y2="6"/>
      <line x1="4" x2="20" y1="18" y2="18"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  );
}

function SidebarPawIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="4" r="2"/>
      <circle cx="18" cy="8" r="2"/>
      <circle cx="20" cy="16" r="2"/>
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
  );
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { label: 'Clientes', href: '/clients', icon: UsersIcon },
  { label: 'Mascotas', href: '/pets', icon: PawIcon },
  { label: 'Citas', href: '/appointments', icon: CalendarIcon },
  { label: 'Inventario', href: '/inventory', icon: BoxIcon },
  { label: 'Reportes', href: '/reports', icon: ChartIcon, adminOnly: true },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, clinic, role, clearAuth } = useAuthStore();

  function handleLogout() {
    clearAuth();
    router.push('/login');
  }

  const firstName = user?.firstName ?? '';
  const lastName = user?.lastName ?? '';

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center bg-vet-800 text-white rounded-lg shadow-md cursor-pointer transition-all duration-200 hover:bg-vet-700"
        aria-label="Abrir menú"
      >
        <MenuIcon />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-vet-800 transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {/* Header */}
        <div className="pt-6 px-5 pb-5 border-b border-vet-700">
          <div className="flex items-center gap-3">
            <SidebarPawIcon />
            <span className="font-heading font-bold text-white text-lg">VetSystem</span>
          </div>
          {clinic?.name && (
            <div className="text-vet-300 text-xs mt-2 pl-0.5">{clinic.name}</div>
          )}
          {/* Mobile close button */}
          <button
            onClick={() => setOpen(false)}
            className="md:hidden absolute top-4 right-4 text-vet-300 hover:text-white cursor-pointer transition-colors duration-200"
            aria-label="Cerrar menú"
          >
            <XIcon />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
          {navItems
            .filter((item) => !item.adminOnly || role === 'ADMIN')
            .map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer text-sm font-medium
                    ${isActive
                      ? 'bg-vet-700 text-white border-l-2 border-vet-300'
                      : 'text-vet-200 hover:bg-vet-700/50 hover:text-white'
                    }`}
                >
                  <item.icon />
                  {item.label}
                </Link>
              );
            })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-vet-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-vet-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{firstName} {lastName}</div>
              <div className="text-vet-300 text-xs truncate">{role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-vet-400 hover:text-red-400 cursor-pointer transition-colors duration-200 flex-shrink-0"
              aria-label="Cerrar sesión"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
