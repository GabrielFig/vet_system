'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { apiFetch } from '@/lib/api';
import { AppointmentCard } from '@/components/appointments/appointment-card';
import { NewAppointmentForm } from '@/components/appointments/new-appointment-form';

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
    await apiFetch(`/appointments/${id}/status`, {
      method: 'PATCH',
      token: accessToken ?? undefined,
      body: { status },
    });
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: status as AppointmentDoc['status'] } : a));
  }

  if (!ready || !user) return <div className="min-h-screen bg-slate-900" />;

  const canAdmin = role === 'ADMIN' || role === 'DOCTOR';

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <a href="/dashboard" className="text-slate-400 hover:text-white text-sm">← Dashboard</a>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Citas</span>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold">Citas</h1>
          <div className="flex items-center gap-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            {canAdmin && (
              <button onClick={() => setShowForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                + Nueva cita
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
            <h2 className="font-semibold mb-4">Nueva cita</h2>
            <NewAppointmentForm
              token={accessToken}
              onSuccess={(a) => { setAppointments((prev) => [...prev, a].sort((x, y) => x.startsAt.localeCompare(y.startsAt))); setShowForm(false); }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {loading ? (
          <div className="text-slate-400 text-center py-12">Cargando...</div>
        ) : appointments.length === 0 ? (
          <div className="text-slate-400 text-center py-12">No hay citas para este día</div>
        ) : (
          <div className="space-y-3">
            {appointments.map((a) => (
              <AppointmentCard key={a.id} appointment={a} onStatusChange={handleStatusChange} canAdmin={canAdmin} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
