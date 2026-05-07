import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { Role } from '@vet/shared-types';

@Injectable()
export class ConsultationsService {
  constructor(private prisma: PrismaService) {}

  async createNote(
    consultationId: string,
    dto: CreateNoteDto,
    authorId: string,
    clinicId: string,
  ) {
    const existing = await this.prisma.medicalNote.findUnique({
      where: { consultationId },
    });
    if (existing) {
      throw new ConflictException(
        'Esta consulta ya tiene una nota. Usa PATCH para editarla.',
      );
    }
    return this.prisma.medicalNote.create({
      data: {
        consultationId,
        clinicId,
        authorId,
        title: dto.title,
        content: dto.content,
        attachmentUrl: dto.attachmentUrl,
      },
    });
  }

  async updateNote(noteId: string, dto: Partial<CreateNoteDto>, userId: string, role: Role) {
    const note = await this.prisma.medicalNote.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException('Nota no encontrada');
    if (role !== Role.ADMIN && note.authorId !== userId) {
      throw new ForbiddenException('Solo puedes editar tus propias notas');
    }
    return this.prisma.medicalNote.update({
      where: { id: noteId },
      data: { title: dto.title, content: dto.content, attachmentUrl: dto.attachmentUrl },
    });
  }

  async deleteNote(noteId: string, role: Role) {
    if (role !== Role.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden eliminar notas');
    }
    const note = await this.prisma.medicalNote.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException('Nota no encontrada');
    await this.prisma.medicalNote.delete({ where: { id: noteId } });
  }

  async createPrescription(
    consultationId: string,
    dto: CreatePrescriptionDto,
    doctorId: string,
    clinicId: string,
  ) {
    return this.prisma.prescription.create({
      data: {
        consultationId,
        clinicId,
        doctorId,
        diagnosis: dto.diagnosis,
        medications: dto.medications,
        instructions: dto.instructions,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
    });
  }

  async createVaccination(
    consultationId: string,
    dto: CreateVaccinationDto,
    appliedById: string,
    clinicId: string,
  ) {
    return this.prisma.vaccination.create({
      data: {
        consultationId,
        clinicId,
        appliedById,
        vaccineName: dto.vaccineName,
        batch: dto.batch,
        appliedAt: new Date(dto.appliedAt),
        nextDose: dto.nextDose ? new Date(dto.nextDose) : undefined,
      },
    });
  }
}
