import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  async getPublicRecord(publicUuid: string) {
    const record = await this.prisma.medicalRecord.findUnique({
      where: { publicUuid },
      include: {
        pet: {
          select: {
            name: true,
            species: true,
            breed: true,
            sex: true,
            birthDate: true,
            client: { select: { firstName: true, lastName: true } },
          },
        },
        consultations: {
          orderBy: { createdAt: 'desc' },
          include: {
            note: { select: { title: true, content: true, createdAt: true, clinicId: true } },
            prescriptions: { select: { diagnosis: true, medications: true, instructions: true, validUntil: true, clinicId: true, createdAt: true } },
            vaccinations: { select: { vaccineName: true, batch: true, appliedAt: true, nextDose: true, clinicId: true } },
          },
        },
      },
    });

    if (!record) throw new NotFoundException('Cartilla no encontrada');
    if (!record.isPublic) throw new NotFoundException('Esta cartilla no es pública');

    return record;
  }
}
