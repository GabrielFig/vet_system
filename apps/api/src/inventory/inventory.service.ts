import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateMovementDto } from './dto/create-movement.dto';
import { MovementType } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(clinicId: string) {
    return this.prisma.product.findMany({
      where: { clinicId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateProductDto, clinicId: string) {
    const existing = await this.prisma.product.findFirst({
      where: { clinicId, sku: dto.sku, isActive: true },
    });
    if (existing) throw new ConflictException('Ya existe un producto con ese SKU');

    return this.prisma.product.create({
      data: { ...dto, clinicId },
    });
  }

  async update(productId: string, dto: UpdateProductDto, clinicId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, clinicId, isActive: true } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return this.prisma.product.update({ where: { id: productId }, data: dto });
  }

  async softDelete(productId: string, clinicId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, clinicId, isActive: true } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return this.prisma.product.update({ where: { id: productId }, data: { isActive: false } });
  }

  async getMovements(productId: string, clinicId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, clinicId } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return this.prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
  }

  async createMovement(
    productId: string,
    dto: CreateMovementDto,
    userId: string,
    clinicId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id: productId, clinicId, isActive: true } });
      if (!product) throw new NotFoundException('Producto no encontrado');

      let newStock: number;
      if (dto.type === 'IN') newStock = product.currentStock + dto.quantity;
      else if (dto.type === 'OUT') newStock = product.currentStock - dto.quantity;
      else newStock = dto.quantity; // ADJUSTMENT

      if (newStock < 0) throw new BadRequestException('Stock insuficiente para registrar esta salida');

      await tx.stockMovement.create({
        data: { productId, clinicId, userId, type: dto.type as MovementType, quantity: dto.quantity, notes: dto.notes },
      });

      const updated = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      return { movement: { type: dto.type, quantity: dto.quantity }, currentStock: updated.currentStock };
    });
  }

  async getLowStock(clinicId: string) {
    const products = await this.prisma.product.findMany({
      where: { clinicId, isActive: true },
    });
    return products.filter((p) => p.currentStock <= p.minStock);
  }
}
