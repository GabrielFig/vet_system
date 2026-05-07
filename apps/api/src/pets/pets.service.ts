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

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, _clinicId: string, role: Role) {
    const where = role === Role.OWNER ? { ownerId: userId } : {};
    return this.prisma.pet.findMany({
      where,
      include: { owner: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(petId: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        record: { select: { id: true, publicUuid: true, isPublic: true } },
      },
    });
    if (!pet) throw new NotFoundException('Mascota no encontrada');
    return pet;
  }

  async create(dto: CreatePetDto, ownerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const pet = await tx.pet.create({
        data: {
          ownerId,
          name: dto.name,
          species: dto.species,
          breed: dto.breed,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
          sex: toDbSex(dto.sex),
        },
      });
      await tx.medicalRecord.create({ data: { petId: pet.id } });
      return pet;
    });
  }

  async update(petId: string, dto: UpdatePetDto) {
    await this.findOne(petId);
    return this.prisma.pet.update({
      where: { id: petId },
      data: {
        name: dto.name,
        species: dto.species,
        breed: dto.breed,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        sex: dto.sex ? toDbSex(dto.sex) : undefined,
        photoUrl: dto.photoUrl,
      },
    });
  }

  async remove(petId: string, role: Role) {
    if (role !== Role.ADMIN) {
      throw new ForbiddenException('Solo los administradores pueden eliminar mascotas');
    }
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
    if (!pet) throw new NotFoundException('Mascota no encontrada');
    return this.prisma.pet.delete({ where: { id: petId } });
  }
}
