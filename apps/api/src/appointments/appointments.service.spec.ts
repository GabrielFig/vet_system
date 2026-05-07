import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';

const mockSchedule = {
  clinicId: 'clinic-1',
  workDays: [1, 2, 3, 4, 5],
  startTime: '09:00',
  endTime: '10:00',
  slotMinutes: 30,
};

const mockAppointmentRepo = {
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

const mockScheduleRepo = {
  findUnique: jest.fn(),
  upsert: jest.fn(),
};

const mockExceptionRepo = {
  create: jest.fn(),
  delete: jest.fn(),
  findFirst: jest.fn(),
};

const mockPrisma = {
  appointment: mockAppointmentRepo,
  clinicSchedule: mockScheduleRepo,
  scheduleException: mockExceptionRepo,
};

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<AppointmentsService>(AppointmentsService);
    jest.clearAllMocks();
  });

  describe('getAvailableSlots', () => {
    it('devuelve slots cuando no hay citas', async () => {
      mockScheduleRepo.findUnique.mockResolvedValue(mockSchedule);
      mockExceptionRepo.findFirst.mockResolvedValue(null);
      mockAppointmentRepo.findMany.mockResolvedValue([]);
      // 2026-05-11 es lunes (workDays incluye 1)
      const slots = await service.getAvailableSlots('clinic-1', '2026-05-11');
      expect(slots).toHaveLength(2); // 09:00 y 09:30
    });

    it('devuelve [] si no hay schedule configurado', async () => {
      mockScheduleRepo.findUnique.mockResolvedValue(null);
      const slots = await service.getAvailableSlots('clinic-1', '2026-05-11');
      expect(slots).toEqual([]);
    });

    it('devuelve [] si el día no es laborable', async () => {
      mockScheduleRepo.findUnique.mockResolvedValue(mockSchedule);
      // 2026-05-10 es domingo (0), no está en workDays
      const slots = await service.getAvailableSlots('clinic-1', '2026-05-10');
      expect(slots).toEqual([]);
    });

    it('excluye slots ya ocupados', async () => {
      mockScheduleRepo.findUnique.mockResolvedValue(mockSchedule);
      mockExceptionRepo.findFirst.mockResolvedValue(null);
      const booked = new Date('2026-05-11T09:00:00.000Z');
      mockAppointmentRepo.findMany.mockResolvedValue([{ startsAt: booked }]);
      const slots = await service.getAvailableSlots('clinic-1', '2026-05-11');
      expect(slots).toHaveLength(1);
      expect(slots[0].startsAt).not.toContain('09:00');
    });
  });

  describe('create', () => {
    it('lanza ConflictException si el slot ya está ocupado', async () => {
      mockScheduleRepo.findUnique.mockResolvedValue(mockSchedule);
      mockAppointmentRepo.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(
        service.create({ petId: 'p-1', startsAt: '2026-05-11T09:00:00.000Z', reason: 'Revisión' }, 'clinic-1', 'doctor-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('lanza NotFoundException si no hay schedule', async () => {
      mockScheduleRepo.findUnique.mockResolvedValue(null);
      mockAppointmentRepo.findFirst.mockResolvedValue(null);
      await expect(
        service.create({ petId: 'p-1', startsAt: '2026-05-11T09:00:00.000Z', reason: 'Revisión' }, 'clinic-1', 'doctor-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
