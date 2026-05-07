'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { apiFetch } from '@/lib/api';
import { AppointmentCard } from '@/components/appointments/appointment-card';
import { NewAppointmentForm } from '@/components/appointments/new-appointment-form';
import { AppShell } from '@/components/layout/app-shell';
import { SkeletonCard } from '@/components/ui/skeleton';

interface AppointmentDoc {
  id: string; startsAt: string; endsAt: string; reason: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'DONE';
  notes: string | null;
  pet: { id: string; name: string; species: string };
  doctor: { id: string; firstName: string; lastName: string };
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
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

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="5" y2="19"/>
      <line x1="5" x2="19" y1="12" y2="12"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  );
}

export default function AppointmentsPage() {
  const { user, accessToken, role, ready } = useRequireAuth();
  const [appointments, setAppointments] = useState<AppointmentDoc[]>([]);
  const [date, setDate] = useState(todayStr());
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !user) return;
    setLoading(true);
    apiFetch<AppointmentDoc[]>(`/appointments?date=${date}`, { token: accessToken ?? undefined })
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, [ready, user, accessToken, date]);

  async function handleStatusChange(id: string, status: string) {
    try {
      await apiFetch(`/appointments/${id}/status`, {
        method: 'PATCH',
        token: accessToken ?? undefined,
        body: { status },
      });
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: status as AppointmentDoc['status'] } : a));
    } catch {
      // status update failed — UI remains unchanged
    }
  }

  if (!ready || !user) return <div className="min-h-screen bg-vet-50" />;

  const canAdmin = role === 'ADMIN' || role === 'DOCTOR';

  return (
    <AppShell>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-vet-100 flex items-center justify-center text-vet-500">
            <CalendarIcon />
          </div>
          <h1 className="font-heading text-2xl font-bold text-vet-800">Citas</h1>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-200 bg-white text-vet-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-vet-500 focus:border-transparent transition-all duration-200 cursor-pointer"
          />
          {canAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-vet-500 hover:bg-vet-600 active:scale-95 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-vet-500 focus:ring-offset-2"
            >
              <PlusIcon />
              Nueva cita
            </button>
          )}
        </div>
      </div>

      {/* Appointment list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-vet-100 mb-4 text-vet-200">
            <CalendarIcon />
          </div>
          <p className="text-gray-500 font-medium">No hay citas para este día</p>
          <p className="text-gray-400 text-sm mt-1">Selecciona otra fecha o crea una nueva cita</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <AppointmentCard key={a.id} appointment={a} onStatusChange={handleStatusChange} canAdmin={canAdmin} />
          ))}
        </div>
      )}

      {/* New appointment modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading font-semibold text-vet-800 text-lg">Nueva cita</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-vet-500 rounded-lg p-1"
                aria-label="Cerrar"
              >
                <XIcon />
              </button>
            </div>
            <NewAppointmentForm
              token={accessToken}
              onSuccess={(a) => {
                setAppointments((prev) => [...prev, a].sort((x, y) => x.startsAt.localeCompare(y.startsAt)));
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}
