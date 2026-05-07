import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@vet/shared-types';
import * as bcrypt from 'bcrypt';

const mockPrisma = {
  user: { findUnique: jest.fn() },
  clinicUser: { findMany: jest.fn(), findUnique: jest.fn() },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn(),
};

const mockConfig = {
  get: jest.fn().mockImplementation((key: string, def: string) => def),
  getOrThrow: jest.fn().mockReturnValue('test-secret'),
};

const mockRedis = {
  set: jest.fn(),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
    mockJwt.sign.mockReturnValue('mock-token');
  });

  describe('login', () => {
    it('retorna AuthResponse cuando el usuario pertenece a 1 clínica', async () => {
      const passwordHash = await bcrypt.hash('Test1234!', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
      });
      mockPrisma.clinicUser.findMany.mockResolvedValue([
        {
          clinicId: 'clinic-1',
          role: Role.DOCTOR,
          clinic: { id: 'clinic-1', name: 'Canes Vet', slug: 'canes', planType: 'PRO' },
        },
      ]);

      const result = await service.login({ email: 'test@test.com', password: 'Test1234!' });

      expect('accessToken' in result).toBe(true);
      if ('accessToken' in result) {
        expect(result.accessToken).toBeDefined();
        expect(result.role).toBe(Role.DOCTOR);
      }
    });

    it('retorna ClinicSelectionRequired cuando el usuario pertenece a N clínicas', async () => {
      const passwordHash = await bcrypt.hash('Test1234!', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
      });
      mockPrisma.clinicUser.findMany.mockResolvedValue([
        { clinicId: 'clinic-1', role: Role.DOCTOR, clinic: { id: 'clinic-1', name: 'Canes', slug: 'canes', planType: 'PRO' } },
        { clinicId: 'clinic-2', role: Role.ADMIN, clinic: { id: 'clinic-2', name: 'Mininos', slug: 'mininos', planType: 'BASIC' } },
      ]);

      const result = await service.login({ email: 'test@test.com', password: 'Test1234!' });

      expect('requiresClinicSelection' in result).toBe(true);
      if ('requiresClinicSelection' in result) {
        expect(result.clinics).toHaveLength(2);
        expect(result.tempToken).toBeDefined();
      }
    });

    it('lanza UnauthorizedException con credenciales inválidas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexiste@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el usuario está inactivo', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: await bcrypt.hash('Test1234!', 12),
        firstName: 'Test',
        lastName: 'User',
        isActive: false,
      });

      await expect(
        service.login({ email: 'test@test.com', password: 'Test1234!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
