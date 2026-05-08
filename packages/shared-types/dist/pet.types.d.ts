export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
export type PetSex = 'male' | 'female';
export interface PetClient {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
}
export interface PetSummary {
    id: string;
    name: string;
    species: PetSpecies;
    breed: string | null;
    birthDate: string | null;
    sex: PetSex;
    photoUrl: string | null;
    client: PetClient;
    createdAt: string;
}
//# sourceMappingURL=pet.types.d.ts.map