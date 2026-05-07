'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { AppShell } from '@/components/layout/app-shell';

function PawIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="4" r="2"/>
      <circle cx="18" cy="8" r="2"/>
      <circle cx="20" cy="16" r="2"/>
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
      <line x1="16" x2="16" y1="2" y2="6"/>
      <line x1="8" x2="8" y1="2" y2="6"/>
      <line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
      <polyline points="3.29 7 12 12 20.71 7"/>
      <line x1="12" x2="12" y1="22" y2="12"/>
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" x2="18" y1="20" y2="10"/>
      <line x1="12" x2="12" y1="20" y2="4"/>
      <line x1="6" x2="6" y1="20" y2="14"/>
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/>
      <path d="m12 5 7 7-7 7"/>
    </svg>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function DashboardPage() {
  const { clinic } = useAuthStore();
  const { user, role, ready } = useRequireAuth();

  if (!ready || !user) return <div className="min-h-screen bg-vet-50" />;

  const modules = [
    {
      label: 'Mascotas',
      description: 'Ver y gestionar pacientes',
      href: '/pets',
      icon: PawIcon,
    },
    {
      label: 'Citas',
      description: 'Agenda del día',
      href: '/appointments',
      icon: CalendarIcon,
    },
    {
      label: 'Inventario',
      description: 'Stock de productos',
      href: '/inventory',
      icon: BoxIcon,
    },
    ...(role === 'ADMIN' ? [{
      label: 'Reportes',
      description: 'PDF mensual de la clínica',
      href: '/reports',
      icon: ChartIcon,
    }] : []),
  ];

  return (
    <AppShell>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-vet-800">
          {getGreeting()}, {user.firstName}
        </h1>
        {clinic?.name && (
          <p className="text-gray-500 text-sm mt-1">{clinic.name}</p>
        )}
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="block bg-white rounded-xl p-6 shadow-sm border border-vet-100 hover:shadow-md hover:border-vet-300 transition-all duration-200 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-vet-100 flex items-center justify-center text-vet-500 mb-4 group-hover:bg-vet-500 group-hover:text-white transition-all duration-200">
              <mod.icon />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="font-heading font-semibold text-vet-800">{mod.label}</div>
                <div className="text-gray-500 text-sm mt-1">{mod.description}</div>
              </div>
              <span className="text-vet-300 group-hover:text-vet-500 transition-colors duration-200">
                <ArrowRightIcon />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
