import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanType, ClinicModuleType } from '@vet/shared-types';

const PLAN_MODULES: Record<PlanType, ClinicModuleType[]> = {
  [PlanType.BASIC]: [],
  [PlanType.PRO]: [ClinicModuleType.INVENTORY, ClinicModuleType.REPORTS],
  [PlanType.ENTERPRISE]: [ClinicModuleType.INVENTORY, ClinicModuleType.REPORTS],
};

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async findAllClinics() {
    return this.prisma.clinic.findMany({
      include: {
        modules: true,
        _count: { select: { users: { where: { isActive: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOneClinic(id: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id },
      include: {
        modules: true,
        users: {
          where: { isActive: true },
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
      },
    });
    if (!clinic) throw new NotFoundException('Clínica no encontrada');
    return clinic;
  }

  async createClinic(dto: { name: string; slug: string; planType: PlanType }) {
    const slug = dto.slug.toLowerCase().replace(/\s+/g, '-');
    const existing = await this.prisma.clinic.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Ya existe una clínica con ese slug');

    const licenseKey = `${slug.toUpperCase()}-${Date.now()}`;
    const modules = PLAN_MODULES[dto.planType] ?? [];

    return this.prisma.clinic.create({
      data: {
        name: dto.name,
        slug,
        licenseKey,
        planType: dto.planType,
        modules: { create: modules.map((m) => ({ module: m })) },
      },
      include: { modules: true },
    });
  }

  async updateClinic(id: string, dto: { name?: string; planType?: PlanType; isActive?: boolean }) {
    const clinic = await this.prisma.clinic.findUnique({ where: { id } });
    if (!clinic) throw new NotFoundException('Clínica no encontrada');
    return this.prisma.clinic.update({
      where: { id },
      data: dto,
      include: { modules: true },
    });
  }

  async enableModule(clinicId: string, mod: ClinicModuleType) {
    await this.prisma.clinicModule.upsert({
      where: { clinicId_module: { clinicId, module: mod } },
      create: { clinicId, module: mod },
      update: {},
    });
    return this.prisma.clinic.findUnique({ where: { id: clinicId }, include: { modules: true } });
  }

  async disableModule(clinicId: string, mod: ClinicModuleType) {
    await this.prisma.clinicModule.deleteMany({ where: { clinicId, module: mod } });
    return this.prisma.clinic.findUnique({ where: { id: clinicId }, include: { modules: true } });
  }

  async setModules(clinicId: string, modules: ClinicModuleType[]) {
    await this.prisma.clinicModule.deleteMany({ where: { clinicId } });
    if (modules.length > 0) {
      await this.prisma.clinicModule.createMany({
        data: modules.map((m) => ({ clinicId, module: m })),
      });
    }
    return this.prisma.clinic.findUnique({ where: { id: clinicId }, include: { modules: true } });
  }
}
