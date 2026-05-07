import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto, UpdateAppointmentStatusDto } from './dto/update-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { AppointmentStatus, MovementType } from '@prisma/client';

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

  async deleteException(exceptionId: string, clinicId: string) {
    const exc = await this.prisma.scheduleException.findFirst({ where: { id: exceptionId, clinicId } });
    if (!exc) throw new NotFoundException('Excepción no encontrada');
    return this.prisma.scheduleException.delete({ where: { id: exceptionId } });
  }

  async getAvailableSlots(clinicId: string, dateStr: string): Promise<{ startsAt: string; endsAt: string }[]> {
    const schedule = await this.prisma.clinicSchedule.findUnique({ where: { clinicId } });
    if (!schedule) return [];

    // Parse as local date to avoid UTC-midnight offset shifting the day
    const [y, mo, d] = dateStr.split('-').map(Number);
    const date = new Date(y, mo - 1, d);
    const dayOfWeek = date.getDay();
    if (!schedule.workDays.includes(dayOfWeek)) return [];

    const dayStart = new Date(y, mo - 1, d, 0, 0, 0, 0);
    const dayEnd = new Date(y, mo - 1, d, 23, 59, 59, 999);

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
      const startsAt = new Date(y, mo - 1, d, Math.floor(m / 60), m % 60, 0, 0);
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
      const [fy, fm, fd] = dto.date.split('-').map(Number);
      where['startsAt'] = {
        gte: new Date(fy, fm - 1, fd, 0, 0, 0, 0),
        lte: new Date(fy, fm - 1, fd, 23, 59, 59, 999),
      };
    }
    if (dto.doctorId) where['doctorId'] = dto.doctorId;
    if (dto.status) where['status'] = dto.status;

    return this.prisma.appointment.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      include: {
        pet: { select: { id: true, name: true, species: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
        consultation: { select: { id: true } },
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

  async update(appointmentId: string, dto: UpdateAppointmentDto, clinicId: string) {
    const appt = await this.prisma.appointment.findFirst({ where: { id: appointmentId, clinicId } });
    if (!appt) throw new NotFoundException('Cita no encontrada');
    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { reason: dto.reason, notes: dto.notes, doctorId: dto.doctorId },
    });
  }

  async updateStatus(appointmentId: string, dto: UpdateAppointmentStatusDto, clinicId: string) {
    const appt = await this.prisma.appointment.findFirst({ where: { id: appointmentId, clinicId } });
    if (!appt) throw new NotFoundException('Cita no encontrada');
    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: dto.status },
    });
  }

  async addProductUsed(
    appointmentId: string,
    dto: { productId: string; quantity: number; notes?: string },
    userId: string,
    clinicId: string,
  ): Promise<{ movement: { type: string; quantity: number }; currentStock: number }> {
    // Verify appointment belongs to this clinic and is not cancelled
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
    });
    if (!appointment) throw new NotFoundException('Cita no encontrada');
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('No se pueden registrar materiales en una cita cancelada');
    }

    // Delegate to inventory logic with pessimistic locking
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        Array<{ id: string; currentStock: number; isActive: boolean }>
      >`
        SELECT id, "currentStock", "isActive"
        FROM "Product"
        WHERE id = ${dto.productId}::uuid
          AND "clinicId" = ${clinicId}::uuid
          AND "isActive" = true
        FOR UPDATE
      `;

      if (rows.length === 0) throw new NotFoundException('Producto no encontrado');
      const product = rows[0];

      const newStock = product.currentStock - dto.quantity;
      if (newStock < 0) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${product.currentStock}, solicitado: ${dto.quantity}`,
        );
      }

      await tx.stockMovement.create({
        data: {
          productId: dto.productId,
          clinicId,
          userId,
          type: MovementType.OUT,
          quantity: dto.quantity,
          notes: dto.notes,
          appointmentId,
        },
      });

      const updated = await tx.product.update({
        where: { id: dto.productId },
        data: { currentStock: newStock },
      });

      return { movement: { type: 'OUT', quantity: dto.quantity }, currentStock: updated.currentStock };
    });
  }

  async getProductsUsed(appointmentId: string, clinicId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
    });
    if (!appointment) throw new NotFoundException('Cita no encontrada');

    return this.prisma.stockMovement.findMany({
      where: { appointmentId, clinicId },
      orderBy: { createdAt: 'asc' },
      include: {
        product: { select: { id: true, name: true, unit: true, category: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async attendAppointment(
    appointmentId: string,
    clinicId: string,
    doctorId: string,
    dto: {
      noteContent?: string;
      noteTitle?: string;
      prescriptions?: Array<{ diagnosis: string; medications: string; instructions: string }>;
      vaccinations?: Array<{ vaccineName: string; batch?: string; appliedAt: string; nextDose?: string }>;
    },
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId },
      include: {
        pet: { select: { id: true, record: { select: { id: true } } } },
        consultation: { select: { id: true } },
      },
    });
    if (!appointment) throw new NotFoundException('Cita no encontrada');
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('No se puede atender una cita cancelada');
    }
    if (appointment.consultation) {
      throw new ConflictException('Esta cita ya tiene una consulta registrada');
    }

    const record = appointment.pet.record ?? await this.prisma.medicalRecord.create({
      data: { petId: appointment.petId },
    });

    const consultation = await this.prisma.consultation.create({
      data: {
        recordId: record.id,
        clinicId,
        doctorId,
        reason: appointment.reason,
        appointmentId,
        note: dto.noteContent
          ? {
              create: {
                clinicId,
                authorId: doctorId,
                title: dto.noteTitle || 'Nota de consulta',
                content: dto.noteContent,
              },
            }
          : undefined,
        prescriptions: dto.prescriptions?.length
          ? {
              create: dto.prescriptions.map((p) => ({
                clinicId,
                doctorId,
                diagnosis: p.diagnosis,
                medications: p.medications,
                instructions: p.instructions,
              })),
            }
          : undefined,
        vaccinations: dto.vaccinations?.length
          ? {
              create: dto.vaccinations.map((v) => ({
                clinicId,
                appliedById: doctorId,
                vaccineName: v.vaccineName,
                batch: v.batch,
                appliedAt: new Date(v.appliedAt),
                nextDose: v.nextDose ? new Date(v.nextDose) : null,
              })),
            }
          : undefined,
      },
      include: {
        note: true,
        prescriptions: true,
        vaccinations: true,
        doctor: { select: { firstName: true, lastName: true } },
      },
    });

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.DONE },
    });

    return consultation;
  }
}
