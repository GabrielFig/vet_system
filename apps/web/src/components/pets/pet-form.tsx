'use client';

import { useState, FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { PetSummary } from '@vet/shared-types';

interface PetFormProps {
  onSuccess: (pet: PetSummary) => void;
  onCancel: () => void;
}

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-vet-800 bg-white focus:outline-none focus:ring-2 focus:ring-vet-500 focus:border-transparent transition-all duration-200';
const labelClass = 'block text-sm font-medium text-vet-800 mb-1';

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
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <div>
        <label className={labelClass}>Nombre *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Nombre de la mascota"
          className={inputClass}
        />
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
        <input
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          placeholder="Opcional"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Fecha de nacimiento</label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-vet-500 hover:bg-vet-600 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-all duration-200 cursor-pointer active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-vet-500 focus:ring-offset-2"
        >
          {loading ? 'Guardando...' : 'Crear mascota'}
        </button>
      </div>
    </form>
  );
}
