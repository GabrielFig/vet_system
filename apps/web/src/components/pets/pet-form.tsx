'use client';

import { useState, FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { PetSummary } from '@vet/shared-types';

interface PetFormProps {
  onSuccess: (pet: PetSummary) => void;
  onCancel: () => void;
}

export function PetForm({ onSuccess, onCancel }: PetFormProps) {
  const token = useAuthStore((s) => s.accessToken);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('dog');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState('male');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const pet = await apiFetch<PetSummary>('/pets', {
        method: 'POST',
        token: token ?? undefined,
        body: { name, species, breed: breed || undefined, sex, birthDate: birthDate || undefined },
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
      {error && <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-lg p-3">{error}</div>}

      <div>
        <label className="block text-slate-300 text-sm mb-1">Nombre *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-300 text-sm mb-1">Especie *</label>
          <select value={species} onChange={(e) => setSpecies(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
            <option value="dog">Perro</option>
            <option value="cat">Gato</option>
            <option value="bird">Ave</option>
            <option value="rabbit">Conejo</option>
            <option value="other">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1">Sexo *</label>
          <select value={sex} onChange={(e) => setSex(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
            <option value="male">Macho</option>
            <option value="female">Hembra</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-slate-300 text-sm mb-1">Raza</label>
        <input value={breed} onChange={(e) => setBreed(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          placeholder="Opcional" />
      </div>

      <div>
        <label className="block text-slate-300 text-sm mb-1">Fecha de nacimiento</label>
        <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-sm transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors">
          {loading ? 'Guardando...' : 'Crear mascota'}
        </button>
      </div>
    </form>
  );
}
