import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto, UpdateAppointmentStatusDto } from './dto/update-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async getSchedule(clinicId: string) {
    return this.prisma.clinicSchedule.findUnique({ where: { clinicId } });
  }

  async upsertSchedule(clinicId: string, dto: UpdateScheduleDto) {
    return this.prisma.clinicSchedule.upsert({
      where: { clinicId },
      create: { clinicId, ...dto },
      update: dto,
    });
  }

  async createException(clinicId: string, dto: CreateExceptionDto) {
    return this.prisma.scheduleException.create({
      data: {
        clinicId,
        date: new Date(dto.date),
        isClosed: dto.isClosed,
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason,
      },
    });
  }

  async deleteException(exceptionId: string) {
    return this.prisma.scheduleException.delete({ where: { id: exceptionId } });
  }

  async getAvailableSlots(clinicId: string, dateStr: string): Promise<{ startsAt: string; endsAt: string }[]> {
    const schedule = await this.prisma.clinicSchedule.findUnique({ where: { clinicId } });
    if (!schedule) return [];

    const date = new Date(dateStr);
    const dayOfWeek = date.getUTCDay();
    if (!schedule.workDays.includes(dayOfWeek)) return [];

    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const exception = await this.prisma.scheduleException.findFirst({
      where: { clinicId, date: { gte: dayStart, lte: dayEnd } },
    });
    if (exception?.isClosed) return [];

    const startTime = exception?.startTime ?? schedule.startTime;
    const endTime = exception?.endTime ?? schedule.endTime;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const slots: { startsAt: Date; endsAt: Date }[] = [];
    for (let m = startMinutes; m + schedule.slotMinutes <= endMinutes; m += schedule.slotMinutes) {
      const startsAt = new Date(date);
      startsAt.setUTCHours(Math.floor(m / 60), m % 60, 0, 0);
      const endsAt = new Date(startsAt.getTime() + schedule.slotMinutes * 60000);
      slots.push({ startsAt, endsAt });
    }

    const booked = await this.prisma.appointment.findMany({
      where: {
        clinicId,
        startsAt: { gte: dayStart, lte: dayEnd },
        status: { not: AppointmentStatus.CANCELLED },
      },
      select: { startsAt: true },
    });

    const bookedSet = new Set(booked.map((a) => a.startsAt.toISOString()));

    return slots
      .filter((s) => !bookedSet.has(s.startsAt.toISOString()))
      .map((s) => ({ startsAt: s.startsAt.toISOString(), endsAt: s.endsAt.toISOString() }));
  }

  async findAll(clinicId: string, dto: QueryAppointmentsDto) {
    const where: Record<string, unknown> = { clinicId };

    if (dto.date) {
      const d = new Date(dto.date);
      const dayStart = new Date(d);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setUTCHours(23, 59, 59, 999);
      where['startsAt'] = { gte: dayStart, lte: dayEnd };
    }
    if (dto.doctorId) where['doctorId'] = dto.doctorId;
    if (dto.status) where['status'] = dto.status;

    return this.prisma.appointment.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      include: {
        pet: { select: { id: true, name: true, species: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(dto: CreateAppointmentDto, clinicId: string, requestingDoctorId: string) {
    const startsAt = new Date(dto.startsAt);

    const conflict = await this.prisma.appointment.findFirst({
      where: {
        clinicId,
        startsAt,
        status: { not: AppointmentStatus.CANCELLED },
      },
    });
    if (conflict) throw new ConflictException('El slot ya está ocupado');

    const schedule = await this.prisma.clinicSchedule.findUnique({ where: { clinicId } });
    if (!schedule) throw new NotFoundException('La clínica no tiene horario configurado');

    const endsAt = new Date(startsAt.getTime() + schedule.slotMinutes * 60000);
    const doctorId = dto.doctorId ?? requestingDoctorId;

    return this.prisma.appointment.create({
      data: { clinicId, petId: dto.petId, doctorId, startsAt, endsAt, reason: dto.reason, notes: dto.notes },
      include: {
        pet: { select: { id: true, name: true, species: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(appointmentId: string, dto: UpdateAppointmentDto) {
    const appt = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appt) throw new NotFoundException('Cita no encontrada');
    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { reason: dto.reason, notes: dto.notes, doctorId: dto.doctorId },
    });
  }

  async updateStatus(appointmentId: string, dto: UpdateAppointmentStatusDto) {
    const appt = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appt) throw new NotFoundException('Cita no encontrada');
    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: dto.status as AppointmentStatus },
    });
  }
}
