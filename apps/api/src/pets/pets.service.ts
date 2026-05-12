import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { Role } from '@vet/shared-types';
import { PetSex } from '@prisma/client';

function toDbSex(sex: string): PetSex {
  return sex.toUpperCase() as PetSex;
}

const clientSelect = { id: true, firstName: true, lastName: true, email: true, phone: true };

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(clinicId: string, clientId?: string) {
    return this.prisma.pet.findMany({
      where: {
        client: { clinicId },
        ...(clientId ? { clientId } : {}),
      },
      include: { client: { select: clientSelect } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(petId: string, clinicId: string) {
    const pet = await this.prisma.pet.findFirst({
      where: { id: petId, client: { clinicId } },
      include: {
        client: { select: clientSelect },
        record: { select: { id: true, publicUuid: true, isPublic: true } },
      },
    });
    if (!pet) throw new NotFoundException('Mascota no encontrada');
    return pet;
  }

  async create(dto: CreatePetDto, clinicId: string) {
    // Verify client belongs to this clinic
    const client = await this.prisma.client.findFirst({ where: { id: dto.clientId, clinicId } });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    return this.prisma.$transaction(async (tx) => {
      const pet = await tx.pet.create({
        data: {
          clientId: dto.clientId,
          name: dto.name,
          species: dto.species,
          breed: dto.breed,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
          sex: toDbSex(dto.sex),
          weight: dto.weight,
        },
        include: { client: { select: clientSelect } },
      });
      await tx.medicalRecord.create({ data: { petId: pet.id } });
      return pet;
    });
  }

  async update(petId: string, clinicId: string, dto: UpdatePetDto) {
    await this.findOne(petId, clinicId);
    return this.prisma.pet.update({
      where: { id: petId },
      data: {
        name: dto.name,
        species: dto.species,
        breed: dto.breed,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        sex: dto.sex ? toDbSex(dto.sex) : undefined,
        photoUrl: dto.photoUrl,
        weight: dto.weight,
      },
      include: { client: { select: clientSelect } },
    });
  }

  async remove(petId: string, clinicId: string, role: Role) {
    if (role !== Role.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden eliminar mascotas');
    }
    const pet = await this.prisma.pet.findFirst({ where: { id: petId, client: { clinicId } } });
    if (!pet) throw new NotFoundException('Mascota no encontrada');
    return this.prisma.pet.delete({ where: { id: petId } });
  }
}
