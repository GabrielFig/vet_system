'use client';

import { useState, useEffect, FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { PetSummary } from '@vet/shared-types';

interface Client { id: string; firstName: string; lastName: string; phone: string | null; email: string | null }

interface PetFormProps {
  onSuccess: (pet: PetSummary) => void;
  onCancel: () => void;
  initialClientId?: string;
  initialClientName?: string;
}

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500 focus:border-transparent transition-all duration-200';
const labelClass = 'block text-sm font-medium text-vet-800 mb-1';

export function PetForm({ onSuccess, onCancel, initialClientId, initialClientName }: PetFormProps) {
  const token = useAuthStore((s) => s.accessToken);

  // Client selection
  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId ?? '');
  const [selectedClientName, setSelectedClientName] = useState(initialClientName ?? '');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientData, setNewClientData] = useState({ firstName: '', lastName: '', phone: '', email: '' });
  const [creatingClient, setCreatingClient] = useState(false);

  // Pet fields
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('dog');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState('male');
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialClientId && clientSearch.length >= 1) {
      apiFetch<Client[]>(`/clients?q=${encodeURIComponent(clientSearch)}`, { token: token ?? undefined })
        .then(setClients)
        .catch(() => {});
    } else if (!clientSearch) {
      setClients([]);
    }
  }, [clientSearch, token, initialClientId]);

  function selectClient(c: Client) {
    setSelectedClientId(c.id);
    setSelectedClientName(`${c.firstName} ${c.lastName}`);
    setClientSearch('');
    setClients([]);
    setShowClientDropdown(false);
  }

  async function handleCreateClient() {
    if (!newClientData.firstName || !newClientData.lastName) return;
    setCreatingClient(true);
    try {
      const c = await apiFetch<Client>('/clients', {
        method: 'POST',
        token: token ?? undefined,
        body: { ...newClientData, phone: newClientData.phone || undefined, email: newClientData.email || undefined },
      });
      selectClient(c);
      setShowNewClientForm(false);
      setNewClientData({ firstName: '', lastName: '', phone: '', email: '' });
    } catch {
      // ignore, keep form open
    } finally {
      setCreatingClient(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedClientId) { setError('Selecciona o crea un dueño'); return; }
    setError('');
    setLoading(true);
    try {
      const pet = await apiFetch<PetSummary>('/pets', {
        method: 'POST',
        token: token ?? undefined,
        body: { clientId: selectedClientId, name, species, breed: breed || undefined, sex, birthDate: birthDate || undefined, weight: weight ? parseFloat(weight) : undefined },
      });
      onSuccess(pet);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al crear mascota');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
      )}

      {/* Client selector */}
      <div>
        <label className={labelClass}>Dueño *</label>
        {initialClientId ? (
          <div className={`${inputClass} bg-vet-50 text-vet-700 cursor-default`}>{initialClientName}</div>
        ) : selectedClientId ? (
          <div className="flex items-center gap-2">
            <div className={`flex-1 ${inputClass} bg-vet-50 text-vet-700 cursor-default`}>{selectedClientName}</div>
            <button type="button" onClick={() => { setSelectedClientId(''); setSelectedClientName(''); }} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer px-2 py-1">Cambiar</button>
          </div>
        ) : (
          <div className="relative">
            <input
              value={clientSearch}
              onChange={(e) => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
              onFocus={() => setShowClientDropdown(true)}
              placeholder="Buscar dueño por nombre..."
              className={inputClass}
            />
            {showClientDropdown && (clients.length > 0 || clientSearch.length >= 1) && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {clients.map((c) => (
                  <button key={c.id} type="button" onClick={() => selectClient(c)}
                    className="w-full text-left px-3 py-2.5 hover:bg-vet-50 transition-colors cursor-pointer border-b border-gray-100 last:border-0">
                    <span className="text-sm font-medium text-vet-800">{c.firstName} {c.lastName}</span>
                    {c.phone && <span className="text-xs text-gray-400 ml-2">{c.phone}</span>}
                  </button>
                ))}
                {clientSearch.length >= 1 && (
                  <button type="button" onClick={() => { setShowClientDropdown(false); setShowNewClientForm(true); }}
                    className="w-full text-left px-3 py-2.5 hover:bg-vet-50 text-vet-600 text-sm font-medium cursor-pointer flex items-center gap-1.5">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                    Crear cliente nuevo
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Inline new client form */}
        {showNewClientForm && (
          <div className="mt-2 border border-dashed border-vet-300 rounded-xl p-3 space-y-2 bg-vet-50">
            <p className="text-xs font-medium text-vet-700 mb-2">Nuevo dueño</p>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Nombre *" value={newClientData.firstName}
                onChange={(e) => setNewClientData((d) => ({ ...d, firstName: e.target.value }))}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500" />
              <input placeholder="Apellido *" value={newClientData.lastName}
                onChange={(e) => setNewClientData((d) => ({ ...d, lastName: e.target.value }))}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Teléfono" value={newClientData.phone}
                onChange={(e) => setNewClientData((d) => ({ ...d, phone: e.target.value }))}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500" />
              <input placeholder="Email" value={newClientData.email}
                onChange={(e) => setNewClientData((d) => ({ ...d, email: e.target.value }))}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleCreateClient} disabled={creatingClient || !newClientData.firstName || !newClientData.lastName}
                className="text-xs bg-vet-500 hover:bg-vet-600 text-white font-medium px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-50 transition-colors">
                {creatingClient ? 'Creando...' : 'Crear dueño'}
              </button>
              <button type="button" onClick={() => setShowNewClientForm(false)}
                className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {!initialClientId && !selectedClientId && !showNewClientForm && (
          <button type="button" onClick={() => setShowNewClientForm(true)}
            className="mt-1.5 text-xs text-vet-500 hover:text-vet-700 cursor-pointer flex items-center gap-1 font-medium">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
            Crear nuevo dueño
          </button>
        )}
      </div>

      {/* Pet fields */}
      <div>
        <label className={labelClass}>Nombre de la mascota *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nombre" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Especie *</label>
          <select value={species} onChange={(e) => setSpecies(e.target.value)} className={inputClass}>
            <option value="dog">Perro</option>
            <option value="cat">Gato</option>
            <option value="bird">Ave</option>
            <option value="rabbit">Conejo</option>
            <option value="other">Otro</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Sexo *</label>
          <select value={sex} onChange={(e) => setSex(e.target.value)} className={inputClass}>
            <option value="male">Macho</option>
            <option value="female">Hembra</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Raza</label>
        <input value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Opcional" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Fecha de nacimiento</label>
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Peso (kg)</label>
          <input type="number" min="0" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Ej. 4.5" className={inputClass} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 bg-vet-500 hover:bg-vet-600 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-all duration-200 cursor-pointer active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-vet-500 focus:ring-offset-2">
          {loading ? 'Guardando...' : 'Crear mascota'}
        </button>
      </div>
    </form>
  );
}
