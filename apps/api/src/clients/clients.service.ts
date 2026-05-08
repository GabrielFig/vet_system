import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(clinicId: string, search?: string) {
    return this.prisma.client.findMany({
      where: {
        clinicId,
        isActive: true,
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { lastName: 'asc' },
      include: { _count: { select: { pets: true } } },
    });
  }

  async findOne(id: string, clinicId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, clinicId },
      include: {
        pets: {
          where: { record: { isNot: null } },
          select: { id: true, name: true, species: true, breed: true, sex: true },
        },
      },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  async create(clinicId: string, dto: { firstName: string; lastName: string; phone?: string; email?: string; notes?: string }) {
    return this.prisma.client.create({
      data: { clinicId, ...dto },
    });
  }

  async update(id: string, clinicId: string, dto: { firstName?: string; lastName?: string; phone?: string; email?: string; notes?: string }) {
    const client = await this.prisma.client.findFirst({ where: { id, clinicId } });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  async deactivate(id: string, clinicId: string) {
    const client = await this.prisma.client.findFirst({ where: { id, clinicId } });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return this.prisma.client.update({ where: { id }, data: { isActive: false } });
  }
}
