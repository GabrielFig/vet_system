export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
export type PetSex = 'male' | 'female';

export interface PetOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface PetSummary {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  birthDate: string | null;
  sex: PetSex;
  photoUrl: string | null;
  owner: PetOwner;
  createdAt: string;
}
