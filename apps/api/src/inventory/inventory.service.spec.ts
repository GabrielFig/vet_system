import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';

const mockProduct = { id: 'prod-1', clinicId: 'clinic-1', currentStock: 10, minStock: 5, isActive: true };

const mockProductRepo = {
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};
const mockMovementRepo = { create: jest.fn(), findMany: jest.fn() };

const mockPrisma = {
  product: mockProductRepo,
  stockMovement: mockMovementRepo,
  $transaction: jest.fn().mockImplementation((fn: (tx: unknown) => unknown) =>
    fn({ product: mockProductRepo, stockMovement: mockMovementRepo }),
  ),
};

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  describe('createMovement', () => {
    it('IN suma al stock actual', async () => {
      mockProductRepo.findFirst.mockResolvedValue(mockProduct);
      mockMovementRepo.create.mockResolvedValue({ id: 'mov-1', type: 'IN', quantity: 5 });
      mockProductRepo.update.mockResolvedValue({ ...mockProduct, currentStock: 15 });

      const result = await service.createMovement('prod-1', { type: 'IN', quantity: 5 }, 'user-1', 'clinic-1');
      expect(result.currentStock).toBe(15);
      expect(mockProductRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { currentStock: 15 } }),
      );
    });

    it('OUT resta al stock actual', async () => {
      mockProductRepo.findFirst.mockResolvedValue(mockProduct);
      mockMovementRepo.create.mockResolvedValue({ id: 'mov-1', type: 'OUT', quantity: 3 });
      mockProductRepo.update.mockResolvedValue({ ...mockProduct, currentStock: 7 });

      const result = await service.createMovement('prod-1', { type: 'OUT', quantity: 3 }, 'user-1', 'clinic-1');
      expect(result.currentStock).toBe(7);
    });

    it('OUT lanza BadRequestException si el stock queda negativo', async () => {
      mockProductRepo.findFirst.mockResolvedValue({ ...mockProduct, currentStock: 2 });
      await expect(
        service.createMovement('prod-1', { type: 'OUT', quantity: 5 }, 'user-1', 'clinic-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('ADJUSTMENT setea el stock al valor dado', async () => {
      mockProductRepo.findFirst.mockResolvedValue(mockProduct);
      mockMovementRepo.create.mockResolvedValue({ id: 'mov-1', type: 'ADJUSTMENT', quantity: 20 });
      mockProductRepo.update.mockResolvedValue({ ...mockProduct, currentStock: 20 });

      const result = await service.createMovement('prod-1', { type: 'ADJUSTMENT', quantity: 20 }, 'user-1', 'clinic-1');
      expect(result.currentStock).toBe(20);
    });

    it('lanza NotFoundException si el producto no existe', async () => {
      mockProductRepo.findFirst.mockResolvedValue(null);
      await expect(
        service.createMovement('prod-1', { type: 'IN', quantity: 1 }, 'user-1', 'clinic-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLowStock', () => {
    it('devuelve solo productos con currentStock <= minStock', async () => {
      const products = [
        { ...mockProduct, currentStock: 3, minStock: 5 },  // bajo stock
        { ...mockProduct, id: 'prod-2', currentStock: 10, minStock: 5 }, // ok
      ];
      mockProductRepo.findMany.mockResolvedValue(products);
      const result = await service.getLowStock('clinic-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('prod-1');
    });
  });
});
