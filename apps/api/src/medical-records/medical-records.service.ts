import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { SearchHistoryDto } from './dto/search-history.dto';

@Injectable()
export class MedicalRecordsService {
  constructor(private prisma: PrismaService) {}

  async findOne(recordId: string) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: {
        pet: { include: { owner: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        consultations: {
          orderBy: { createdAt: 'desc' },
          include: { note: true, prescriptions: true, vaccinations: true },
        },
      },
    });
    if (!record) throw new NotFoundException('Cartilla no encontrada');
    return record;
  }

  async createConsultation(
    recordId: string,
    dto: CreateConsultationDto,
    doctorId: string,
    clinicId: string,
  ) {
    const record = await this.prisma.medicalRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundException('Cartilla no encontrada');
    return this.prisma.consultation.create({
      data: { recordId, clinicId, doctorId, reason: dto.reason },
      include: { note: true, prescriptions: true, vaccinations: true },
    });
  }

  async searchNotes(recordId: string, dto: SearchHistoryDto) {
    return this.prisma.medicalNote.findMany({
      where: {
        consultation: { recordId },
        ...(dto.q ? {
          OR: [
            { title: { contains: dto.q, mode: 'insensitive' } },
            { content: { contains: dto.q, mode: 'insensitive' } },
          ],
        } : {}),
        ...(dto.from || dto.to ? {
          createdAt: {
            ...(dto.from ? { gte: new Date(dto.from) } : {}),
            ...(dto.to ? { lte: new Date(dto.to) } : {}),
          },
        } : {}),
      },
      include: { consultation: { select: { clinicId: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchPrescriptions(recordId: string, dto: SearchHistoryDto) {
    return this.prisma.prescription.findMany({
      where: {
        consultation: { recordId },
        ...(dto.q ? {
          OR: [
            { diagnosis: { contains: dto.q, mode: 'insensitive' } },
            { medications: { contains: dto.q, mode: 'insensitive' } },
          ],
        } : {}),
        ...(dto.from || dto.to ? {
          createdAt: {
            ...(dto.from ? { gte: new Date(dto.from) } : {}),
            ...(dto.to ? { lte: new Date(dto.to) } : {}),
          },
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchVaccinations(recordId: string, dto: SearchHistoryDto) {
    return this.prisma.vaccination.findMany({
      where: {
        consultation: { recordId },
        ...(dto.q ? {
          OR: [
            { vaccineName: { contains: dto.q, mode: 'insensitive' } },
            { batch: { contains: dto.q, mode: 'insensitive' } },
          ],
        } : {}),
        ...(dto.from || dto.to ? {
          appliedAt: {
            ...(dto.from ? { gte: new Date(dto.from) } : {}),
            ...(dto.to ? { lte: new Date(dto.to) } : {}),
          },
        } : {}),
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async generateQr(recordId: string, webUrl: string): Promise<{ qrCodeUrl: string; publicUuid: string }> {
    const record = await this.prisma.medicalRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundException('Cartilla no encontrada');

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const QRCode = require('qrcode') as { toDataURL: (url: string, opts: object) => Promise<string> };
    const publicUrl = `${webUrl}/public/${record.publicUuid}`;
    const qrDataUrl = await QRCode.toDataURL(publicUrl, { width: 300, margin: 2 });

    const updated = await this.prisma.medicalRecord.update({
      where: { id: recordId },
      data: { qrCodeUrl: qrDataUrl },
    });

    return { qrCodeUrl: updated.qrCodeUrl!, publicUuid: updated.publicUuid };
  }
}
