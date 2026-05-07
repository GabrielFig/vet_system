import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@vet/shared-types';

const mockPrisma = {
  consultation: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  medicalNote: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  prescription: { create: jest.fn() },
  vaccination: { create: jest.fn() },
};

describe('ConsultationsService', () => {
  let service: ConsultationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ConsultationsService>(ConsultationsService);
    jest.clearAllMocks();
  });

  describe('createNote', () => {
    it('lanza ConflictException si la consulta ya tiene nota', async () => {
      mockPrisma.medicalNote.findUnique.mockResolvedValue({ id: 'note-1' });
      await expect(
        service.createNote('consult-1', { title: 'T', content: 'C' }, 'user-1', 'clinic-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('crea nota cuando no existe una previa', async () => {
      mockPrisma.medicalNote.findUnique.mockResolvedValue(null);
      mockPrisma.medicalNote.create.mockResolvedValue({ id: 'note-1', title: 'T' });
      const result = await service.createNote('consult-1', { title: 'T', content: 'C' }, 'user-1', 'clinic-1');
      expect(result.id).toBe('note-1');
    });
  });

  describe('deleteNote', () => {
    it('lanza ForbiddenException si el rol no es ADMIN', async () => {
      await expect(
        service.deleteNote('note-1', Role.DOCTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lanza NotFoundException si la nota no existe', async () => {
      mockPrisma.medicalNote.findUnique.mockResolvedValue(null);
      await expect(
        service.deleteNote('note-1', Role.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('elimina la nota si el rol es ADMIN y existe', async () => {
      mockPrisma.medicalNote.findUnique.mockResolvedValue({ id: 'note-1' });
      mockPrisma.medicalNote.delete.mockResolvedValue({ id: 'note-1' });
      await expect(service.deleteNote('note-1', Role.ADMIN)).resolves.not.toThrow();
    });
  });
});
