import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@vet/shared-types';

const mockPetRepo = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockMedicalRecordRepo = { create: jest.fn() };

const mockPrisma = {
  pet: mockPetRepo,
  medicalRecord: mockMedicalRecordRepo,
  $transaction: jest.fn().mockImplementation((fn: (tx: unknown) => unknown) =>
    fn({ pet: mockPetRepo, medicalRecord: mockMedicalRecordRepo }),
  ),
};

describe('PetsService', () => {
  let service: PetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PetsService>(PetsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('OWNER solo ve sus propias mascotas', async () => {
      mockPrisma.pet.findMany.mockResolvedValue([]);
      await service.findAll('user-owner', 'clinic-1', Role.OWNER);
      expect(mockPrisma.pet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ ownerId: 'user-owner' }) }),
      );
    });

    it('DOCTOR ve todas las mascotas (sin filtro de owner)', async () => {
      mockPrisma.pet.findMany.mockResolvedValue([]);
      await service.findAll('user-doctor', 'clinic-1', Role.DOCTOR);
      const call = mockPrisma.pet.findMany.mock.calls[0][0];
      expect(call.where).not.toHaveProperty('ownerId');
    });
  });

  describe('create', () => {
    it('crea mascota y su MedicalRecord en una transacción', async () => {
      const mockPet = { id: 'pet-1', name: 'Luna', ownerId: 'user-1' };
      mockPrisma.pet.create.mockResolvedValue(mockPet);
      mockPrisma.medicalRecord.create.mockResolvedValue({ id: 'record-1' });

      const result = await service.create(
        { name: 'Luna', species: 'dog', sex: 'female' },
        'user-1',
      );

      expect(result).toEqual(mockPet);
      expect(mockPrisma.medicalRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ petId: 'pet-1' }) }),
      );
    });
  });

  describe('remove', () => {
    it('lanza ForbiddenException si el usuario no es ADMIN', async () => {
      await expect(service.remove('pet-1', Role.DOCTOR)).rejects.toThrow(ForbiddenException);
    });

    it('lanza NotFoundException si la mascota no existe', async () => {
      mockPrisma.pet.findUnique.mockResolvedValue(null);
      await expect(service.remove('pet-1', Role.ADMIN)).rejects.toThrow(NotFoundException);
    });
  });
});
