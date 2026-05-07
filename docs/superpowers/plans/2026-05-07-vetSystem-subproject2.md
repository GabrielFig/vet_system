# VetSystem Sub-proyecto 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar Citas con slots configurables, Inventario con control de stock y generación de PDF para cartilla médica y reportes mensuales.

**Architecture:** Tres módulos NestJS nuevos (appointments, inventory, reports) cada uno con su propio service/controller/module, registrados en AppModule. El frontend agrega páginas `/appointments`, `/inventory`, `/reports` y botones de descarga PDF en la cartilla. Un solo migration de Prisma cubre todos los modelos nuevos.

**Tech Stack:** NestJS + Prisma + PostgreSQL (existente) · pdfmake (nuevo, server-side PDF) · Next.js 14 App Router (existente) · Tailwind CSS (existente)

---

## File Map

```
apps/api/prisma/schema.prisma                        MODIFY — agregar 5 modelos + 2 enums + relaciones en User/Pet
apps/api/src/app.module.ts                           MODIFY — registrar AppointmentsModule, InventoryModule, ReportsModule

apps/api/src/appointments/dto/create-appointment.dto.ts   CREATE
apps/api/src/appointments/dto/update-appointment.dto.ts   CREATE
apps/api/src/appointments/dto/query-appointments.dto.ts   CREATE
apps/api/src/appointments/dto/update-schedule.dto.ts      CREATE
apps/api/src/appointments/dto/create-exception.dto.ts     CREATE
apps/api/src/appointments/appointments.service.ts         CREATE
apps/api/src/appointments/appointments.service.spec.ts    CREATE
apps/api/src/appointments/appointments.controller.ts      CREATE
apps/api/src/appointments/appointments.module.ts          CREATE

apps/api/src/inventory/dto/create-product.dto.ts          CREATE
apps/api/src/inventory/dto/update-product.dto.ts          CREATE
apps/api/src/inventory/dto/create-movement.dto.ts         CREATE
apps/api/src/inventory/inventory.service.ts               CREATE
apps/api/src/inventory/inventory.service.spec.ts          CREATE
apps/api/src/inventory/inventory.controller.ts            CREATE
apps/api/src/inventory/inventory.module.ts                CREATE

apps/api/src/reports/reports.service.ts                   CREATE
apps/api/src/reports/reports.controller.ts                CREATE
apps/api/src/reports/reports.module.ts                    CREATE

apps/web/src/app/appointments/page.tsx                    CREATE
apps/web/src/components/appointments/appointment-card.tsx  CREATE
apps/web/src/components/appointments/new-appointment-form.tsx CREATE
apps/web/src/app/inventory/page.tsx                       CREATE
apps/web/src/components/inventory/product-form.tsx        CREATE
apps/web/src/components/inventory/movement-form.tsx       CREATE
apps/web/src/app/reports/page.tsx                         CREATE
apps/web/src/app/pets/[id]/record/page.tsx                MODIFY — botón Descargar PDF
apps/web/src/app/dashboard/page.tsx                       MODIFY — links a Citas, Inventario, Reportes + badge stock bajo
```

---

## Task 1: Prisma Schema + Migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Agregar enums y modelos al schema**

Agregar al final de `apps/api/prisma/schema.prisma`, después del modelo `Vaccination`:

```prisma
// ── CITAS ─────────────────────────────────────────────────

enum AppointmentStatus {
  PENDING
  CONFIRMED
  CANCELLED
  DONE
}

model ClinicSchedule {
  id          String   @id @default(uuid())
  clinicId    String   @unique
  workDays    Int[]
  startTime   String
  endTime     String
  slotMinutes Int      @default(30)
  updatedAt   DateTime @updatedAt
}

model ScheduleException {
  id        String   @id @default(uuid())
  clinicId  String
  date      DateTime
  isClosed  Boolean  @default(true)
  startTime String?
  endTime   String?
  reason    String?

  @@index([clinicId])
}

model Appointment {
  id        String            @id @default(uuid())
  clinicId  String
  petId     String
  doctorId  String
  startsAt  DateTime
  endsAt    DateTime
  reason    String
  status    AppointmentStatus @default(PENDING)
  notes     String?
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt
  pet       Pet               @relation(fields: [petId], references: [id])
  doctor    User              @relation("AppointmentDoctor", fields: [doctorId], references: [id])

  @@index([clinicId])
  @@index([petId])
  @@index([doctorId])
  @@index([startsAt])
}

// ── INVENTARIO ────────────────────────────────────────────

enum MovementType {
  IN
  OUT
  ADJUSTMENT
}

model Product {
  id           String          @id @default(uuid())
  clinicId     String
  name         String
  sku          String
  category     String
  unit         String
  currentStock Int             @default(0)
  minStock     Int             @default(5)
  costPrice    Decimal         @db.Decimal(10, 2)
  salePrice    Decimal         @db.Decimal(10, 2)
  isActive     Boolean         @default(true)
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  movements    StockMovement[]

  @@unique([clinicId, sku])
  @@index([clinicId])
}

model StockMovement {
  id        String       @id @default(uuid())
  productId String
  clinicId  String
  userId    String
  type      MovementType
  quantity  Int
  notes     String?
  createdAt DateTime     @default(now())
  product   Product      @relation(fields: [productId], references: [id])
  user      User         @relation("StockMovementUser", fields: [userId], references: [id])

  @@index([productId])
  @@index([clinicId])
}
```

- [ ] **Step 2: Agregar relaciones en User y Pet**

En el model `User`, agregar después de `vaccinationsApplied`:
```prisma
  appointments   Appointment[]   @relation("AppointmentDoctor")
  stockMovements StockMovement[] @relation("StockMovementUser")
```

En el model `Pet`, agregar después de `record`:
```prisma
  appointments Appointment[]
```

- [ ] **Step 3: Ejecutar migration**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/api
npx prisma migrate dev --name add_appointments_inventory
```

Expected: `Your database is now in sync with your schema.`

- [ ] **Step 4: Verificar que el cliente de Prisma se generó**

```bash
npx prisma generate
```

Expected: `Generated Prisma Client`

- [ ] **Step 5: Commit**

```bash
cd /home/gabriel/Documentos/vetSystem
git add apps/api/prisma/
git commit -m "feat: add Appointment, ClinicSchedule, Product, StockMovement models to Prisma schema"
```

---

## Task 2: Appointments Backend

**Files:**
- Create: `apps/api/src/appointments/dto/create-appointment.dto.ts`
- Create: `apps/api/src/appointments/dto/update-appointment.dto.ts`
- Create: `apps/api/src/appointments/dto/query-appointments.dto.ts`
- Create: `apps/api/src/appointments/dto/update-schedule.dto.ts`
- Create: `apps/api/src/appointments/dto/create-exception.dto.ts`
- Create: `apps/api/src/appointments/appointments.service.spec.ts`
- Create: `apps/api/src/appointments/appointments.service.ts`
- Create: `apps/api/src/appointments/appointments.controller.ts`
- Create: `apps/api/src/appointments/appointments.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Escribir el test que falla**

`apps/api/src/appointments/appointments.service.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';

const mockSchedule = {
  clinicId: 'clinic-1',
  workDays: [1, 2, 3, 4, 5],
  startTime: '09:00',
  endTime: '10:00',
  slotMinutes: 30,
};

const mockAppointmentRepo = {
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

const mockScheduleRepo = {
  findUnique: jest.fn(),
  upsert: jest.fn(),
};

const mockExceptionRepo = {
  create: jest.fn(),
  delete: jest.fn(),
  findFirst: jest.fn(),
};

const mockPrisma = {
  appointment: mockAppointmentRepo,
  clinicSchedule: mockScheduleRepo,
  scheduleException: mockExceptionRepo,
};

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<AppointmentsService>(AppointmentsService);
    jest.clearAllMocks();
  });

  describe('getAvailableSlots', () => {
    it('devuelve slots cuando no hay citas', async () => {
      mockScheduleRepo.findUnique.mockResolvedValue(mockSchedule);
      mockExceptionRepo.findFirst.mockResolvedValue(null);
      mockAppointmentRepo.findMany.mockResolvedValue([]);
      // 2026-05-11 es lunes (workDays incluye 1)
      const slots = await service.getAvailableSlots('clinic-1', '2026-05-11');
      expect(slots).toHaveLength(2); // 09:00 y 09:30
    });

    it('devuelve [] si no hay schedule configurado', async () => {
      mockScheduleRepo.findUnique.mockResolvedValue(null);
      const slots = await service.getAvailableSlots('clinic-1', '2026-05-11');
      expect(slots).toEqual([]);
    });

    it('devuelve [] si el día no es laborable', async () => {
      mockScheduleRepo.findUnique.mockResolvedValue(mockSchedule);
      // 2026-05-10 es domingo (0), no está en workDays
      const slots = await service.getAvailableSlots('clinic-1', '2026-05-10');
      expect(slots).toEqual([]);
    });

    it('excluye slots ya ocupados', async () => {
      mockScheduleRepo.findUnique.mockResolvedValue(mockSchedule);
      mockExceptionRepo.findFirst.mockResolvedValue(null);
      const booked = new Date('2026-05-11T09:00:00.000Z');
      mockAppointmentRepo.findMany.mockResolvedValue([{ startsAt: booked }]);
      const slots = await service.getAvailableSlots('clinic-1', '2026-05-11');
      expect(slots).toHaveLength(1);
      expect(slots[0].startsAt).not.toContain('09:00');
    });
  });

  describe('create', () => {
    it('lanza ConflictException si el slot ya está ocupado', async () => {
      mockScheduleRepo.findUnique.mockResolvedValue(mockSchedule);
      mockAppointmentRepo.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(
        service.create({ petId: 'p-1', startsAt: '2026-05-11T09:00:00.000Z', reason: 'Revisión' }, 'clinic-1', 'doctor-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('lanza NotFoundException si no hay schedule', async () => {
      mockScheduleRepo.findUnique.mockResolvedValue(null);
      mockAppointmentRepo.findFirst.mockResolvedValue(null);
      await expect(
        service.create({ petId: 'p-1', startsAt: '2026-05-11T09:00:00.000Z', reason: 'Revisión' }, 'clinic-1', 'doctor-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/api
npx jest src/appointments/appointments.service.spec.ts --no-coverage
```

Expected: FAIL — `Cannot find module './appointments.service'`

- [ ] **Step 3: Crear los DTOs**

`apps/api/src/appointments/dto/create-appointment.dto.ts`:
```typescript
import { IsString, IsISO8601, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  petId: string;

  @IsISO8601()
  startsAt: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

`apps/api/src/appointments/dto/update-appointment.dto.ts`:
```typescript
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;
}

export class UpdateAppointmentStatusDto {
  @IsEnum(['PENDING', 'CONFIRMED', 'CANCELLED', 'DONE'])
  status: string;
}
```

`apps/api/src/appointments/dto/query-appointments.dto.ts`:
```typescript
import { IsOptional, IsString, IsISO8601 } from 'class-validator';

export class QueryAppointmentsDto {
  @IsOptional()
  @IsISO8601()
  date?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsEnum(['PENDING', 'CONFIRMED', 'CANCELLED', 'DONE'])
  status?: string;
}

import { IsEnum } from 'class-validator';
```

`apps/api/src/appointments/dto/query-appointments.dto.ts` (correcto, sin duplicar import):
```typescript
import { IsOptional, IsString, IsISO8601, IsEnum } from 'class-validator';

export class QueryAppointmentsDto {
  @IsOptional()
  @IsISO8601()
  date?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsEnum(['PENDING', 'CONFIRMED', 'CANCELLED', 'DONE'])
  status?: string;
}
```

`apps/api/src/appointments/dto/update-schedule.dto.ts`:
```typescript
import { IsArray, IsInt, IsString, Min, Max } from 'class-validator';

export class UpdateScheduleDto {
  @IsArray()
  @IsInt({ each: true })
  workDays: number[];

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsInt()
  @Min(15)
  @Max(120)
  slotMinutes: number;
}
```

`apps/api/src/appointments/dto/create-exception.dto.ts`:
```typescript
import { IsISO8601, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateExceptionDto {
  @IsISO8601()
  date: string;

  @IsBoolean()
  isClosed: boolean;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
```

- [ ] **Step 4: Crear `apps/api/src/appointments/appointments.service.ts`**

```typescript
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto, UpdateAppointmentStatusDto } from './dto/update-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { AppointmentStatus } from '@prisma/client';

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

  async deleteException(exceptionId: string) {
    return this.prisma.scheduleException.delete({ where: { id: exceptionId } });
  }

  async getAvailableSlots(clinicId: string, dateStr: string): Promise<{ startsAt: string; endsAt: string }[]> {
    const schedule = await this.prisma.clinicSchedule.findUnique({ where: { clinicId } });
    if (!schedule) return [];

    const date = new Date(dateStr);
    const dayOfWeek = date.getUTCDay();
    if (!schedule.workDays.includes(dayOfWeek)) return [];

    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setUTCHours(23, 59, 59, 999);

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
      const startsAt = new Date(date);
      startsAt.setUTCHours(Math.floor(m / 60), m % 60, 0, 0);
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
      const d = new Date(dto.date);
      const dayStart = new Date(d);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setUTCHours(23, 59, 59, 999);
      where['startsAt'] = { gte: dayStart, lte: dayEnd };
    }
    if (dto.doctorId) where['doctorId'] = dto.doctorId;
    if (dto.status) where['status'] = dto.status;

    return this.prisma.appointment.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      include: {
        pet: { select: { id: true, name: true, species: true } },
        doctor: { select: { id: true, firstName: true, lastName: true } },
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

  async update(appointmentId: string, dto: UpdateAppointmentDto) {
    const appt = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appt) throw new NotFoundException('Cita no encontrada');
    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { reason: dto.reason, notes: dto.notes, doctorId: dto.doctorId },
    });
  }

  async updateStatus(appointmentId: string, dto: UpdateAppointmentStatusDto) {
    const appt = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appt) throw new NotFoundException('Cita no encontrada');
    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: dto.status as AppointmentStatus },
    });
  }
}
```

- [ ] **Step 5: Ejecutar el test para verificar que pasa**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/api
npx jest src/appointments/appointments.service.spec.ts --no-coverage
```

Expected: PASS — 5 tests passed.

- [ ] **Step 6: Crear `apps/api/src/appointments/appointments.controller.ts`**

```typescript
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto, UpdateAppointmentStatusDto } from './dto/update-appointment.dto';
import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtPayload, Role } from '@vet/shared-types';

@Controller('appointments')
export class AppointmentsController {
  constructor(private service: AppointmentsService) {}

  @Get('schedule')
  getSchedule(@CurrentUser() user: JwtPayload) {
    return this.service.getSchedule(user.clinicId);
  }

  @Roles(Role.ADMIN)
  @Post('schedule')
  upsertSchedule(@Body() dto: UpdateScheduleDto, @CurrentUser() user: JwtPayload) {
    return this.service.upsertSchedule(user.clinicId, dto);
  }

  @Roles(Role.ADMIN)
  @Post('schedule/exceptions')
  createException(@Body() dto: CreateExceptionDto, @CurrentUser() user: JwtPayload) {
    return this.service.createException(user.clinicId, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('schedule/exceptions/:exId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteException(@Param('exId') exId: string) {
    return this.service.deleteException(exId);
  }

  @Get('available-slots')
  getAvailableSlots(
    @Query('clinicId') clinicId: string,
    @Query('date') date: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.getAvailableSlots(clinicId ?? user.clinicId, date);
  }

  @Get()
  findAll(@Query() dto: QueryAppointmentsDto, @CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.clinicId, dto);
  }

  @Post()
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.clinicId, user.sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) {
    return this.service.updateStatus(id, dto);
  }
}
```

- [ ] **Step 7: Crear `apps/api/src/appointments/appointments.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService, PrismaService],
})
export class AppointmentsModule {}
```

- [ ] **Step 8: Registrar AppointmentsModule en AppModule**

En `apps/api/src/app.module.ts`, agregar:
```typescript
import { AppointmentsModule } from './appointments/appointments.module';
// En imports[]:
AppointmentsModule,
```

- [ ] **Step 9: Verificar que todos los tests pasan**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/api
npx jest --no-coverage
```

Expected: todos los tests pasan.

- [ ] **Step 10: Commit**

```bash
cd /home/gabriel/Documentos/vetSystem
git add apps/api/src/appointments/ apps/api/src/app.module.ts
git commit -m "feat: add appointments module with schedule config, slot availability and CRUD"
```

---

## Task 3: Appointments Frontend

**Files:**
- Create: `apps/web/src/components/appointments/appointment-card.tsx`
- Create: `apps/web/src/components/appointments/new-appointment-form.tsx`
- Create: `apps/web/src/app/appointments/page.tsx`
- Modify: `apps/web/src/app/dashboard/page.tsx`

- [ ] **Step 1: Crear `apps/web/src/components/appointments/appointment-card.tsx`**

```typescript
interface AppointmentDoc {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'DONE';
  notes: string | null;
  pet: { id: string; name: string; species: string };
  doctor: { id: string; firstName: string; lastName: string };
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmada', CANCELLED: 'Cancelada', DONE: 'Realizada',
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-300',
  CONFIRMED: 'bg-green-500/20 text-green-300',
  CANCELLED: 'bg-red-500/20 text-red-300',
  DONE: 'bg-slate-500/20 text-slate-400',
};
const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐶', cat: '🐱', bird: '🐦', rabbit: '🐰', other: '🐾',
};

interface Props {
  appointment: AppointmentDoc;
  onStatusChange: (id: string, status: string) => void;
  canAdmin: boolean;
}

export function AppointmentCard({ appointment: a, onStatusChange, canAdmin }: Props) {
  const time = new Date(a.startsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-start gap-4">
      <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center text-xl flex-shrink-0">
        {SPECIES_EMOJI[a.pet.species] ?? '🐾'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <span className="font-semibold text-white text-sm">{time}</span>
            <span className="text-slate-400 text-sm ml-2">— {a.pet.name}</span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[a.status]}`}>
            {STATUS_LABEL[a.status]}
          </span>
        </div>
        <p className="text-slate-400 text-sm mt-0.5">{a.reason}</p>
        <p className="text-slate-500 text-xs mt-0.5">Dr. {a.doctor.firstName} {a.doctor.lastName}</p>
        {a.notes && <p className="text-slate-500 text-xs mt-1 italic">{a.notes}</p>}
      </div>
      {canAdmin && a.status !== 'DONE' && a.status !== 'CANCELLED' && (
        <div className="flex flex-col gap-1 flex-shrink-0">
          {a.status === 'PENDING' && (
            <button
              onClick={() => onStatusChange(a.id, 'CONFIRMED')}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
            >
              Confirmar
            </button>
          )}
          <button
            onClick={() => onStatusChange(a.id, 'DONE')}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded transition-colors"
          >
            Realizada
          </button>
          <button
            onClick={() => onStatusChange(a.id, 'CANCELLED')}
            className="text-xs bg-slate-600 hover:bg-slate-500 text-white px-2 py-1 rounded transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Crear `apps/web/src/components/appointments/new-appointment-form.tsx`**

```typescript
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

interface Slot { startsAt: string; endsAt: string }
interface Pet { id: string; name: string; species: string }
interface AppointmentDoc {
  id: string; startsAt: string; endsAt: string; reason: string; status: string;
  notes: string | null;
  pet: { id: string; name: string; species: string };
  doctor: { id: string; firstName: string; lastName: string };
}

interface Props {
  token: string | null;
  onSuccess: (a: AppointmentDoc) => void;
  onCancel: () => void;
}

export function NewAppointmentForm({ token, onSuccess, onCancel }: Props) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [petId, setPetId] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotIndex, setSlotIndex] = useState<number>(-1);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    apiFetch<Pet[]>('/pets', { token: token ?? undefined }).then(setPets).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!date) { setSlots([]); return; }
    setLoadingSlots(true);
    apiFetch<Slot[]>(`/appointments/available-slots?date=${date}`, { token: token ?? undefined })
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date, token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (slotIndex < 0) { setError('Selecciona un slot'); return; }
    setError('');
    setLoading(true);
    try {
      const appt = await apiFetch<AppointmentDoc>('/appointments', {
        method: 'POST',
        token: token ?? undefined,
        body: { petId, startsAt: slots[slotIndex].startsAt, reason },
      });
      onSuccess(appt);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al crear cita');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-lg p-3">{error}</div>}

      <div>
        <label className="block text-slate-300 text-sm mb-1">Mascota *</label>
        <select value={petId} onChange={(e) => setPetId(e.target.value)} required
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
          <option value="">Seleccionar...</option>
          {pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-slate-300 text-sm mb-1">Fecha *</label>
        <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSlotIndex(-1); }} required
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
      </div>

      {date && (
        <div>
          <label className="block text-slate-300 text-sm mb-1">Horario *</label>
          {loadingSlots ? (
            <p className="text-slate-400 text-sm">Cargando slots...</p>
          ) : slots.length === 0 ? (
            <p className="text-slate-400 text-sm">No hay slots disponibles para este día</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((s, i) => {
                const time = new Date(s.startsAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                return (
                  <button key={i} type="button" onClick={() => setSlotIndex(i)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${slotIndex === i ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                    {time}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-slate-300 text-sm mb-1">Motivo *</label>
        <input value={reason} onChange={(e) => setReason(e.target.value)} required
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          placeholder="Revisión general, vacunación..." />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-sm transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors">
          {loading ? 'Guardando...' : 'Crear cita'}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Crear `apps/web/src/app/appointments/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { apiFetch } from '@/lib/api';
import { AppointmentCard } from '@/components/appointments/appointment-card';
import { NewAppointmentForm } from '@/components/appointments/new-appointment-form';

interface AppointmentDoc {
  id: string; startsAt: string; endsAt: string; reason: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'DONE';
  notes: string | null;
  pet: { id: string; name: string; species: string };
  doctor: { id: string; firstName: string; lastName: string };
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function AppointmentsPage() {
  const { user, accessToken, role, ready } = useRequireAuth();
  const [appointments, setAppointments] = useState<AppointmentDoc[]>([]);
  const [date, setDate] = useState(todayStr());
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !user) return;
    setLoading(true);
    apiFetch<AppointmentDoc[]>(`/appointments?date=${date}`, { token: accessToken ?? undefined })
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, [ready, user, accessToken, date]);

  async function handleStatusChange(id: string, status: string) {
    await apiFetch(`/appointments/${id}/status`, {
      method: 'PATCH',
      token: accessToken ?? undefined,
      body: { status },
    });
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: status as AppointmentDoc['status'] } : a));
  }

  if (!ready || !user) return <div className="min-h-screen bg-slate-900" />;

  const canAdmin = role === 'ADMIN' || role === 'DOCTOR';

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <a href="/dashboard" className="text-slate-400 hover:text-white text-sm">← Dashboard</a>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Citas</span>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold">Citas</h1>
          <div className="flex items-center gap-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
            {canAdmin && (
              <button onClick={() => setShowForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                + Nueva cita
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
            <h2 className="font-semibold mb-4">Nueva cita</h2>
            <NewAppointmentForm
              token={accessToken}
              onSuccess={(a) => { setAppointments((prev) => [...prev, a].sort((x, y) => x.startsAt.localeCompare(y.startsAt))); setShowForm(false); }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {loading ? (
          <div className="text-slate-400 text-center py-12">Cargando...</div>
        ) : appointments.length === 0 ? (
          <div className="text-slate-400 text-center py-12">No hay citas para este día</div>
        ) : (
          <div className="space-y-3">
            {appointments.map((a) => (
              <AppointmentCard key={a.id} appointment={a} onStatusChange={handleStatusChange} canAdmin={canAdmin} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Agregar link a Citas en el Dashboard**

En `apps/web/src/app/dashboard/page.tsx`, agregar en el nav y en la grilla de tarjetas:

Nav — después del link `Mascotas`:
```tsx
<a href="/appointments" className="text-slate-300 hover:text-white text-sm">Citas</a>
<a href="/inventory" className="text-slate-300 hover:text-white text-sm">Inventario</a>
```

Grilla — después de la tarjeta de Mascotas:
```tsx
<a href="/appointments" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-6 block transition-colors">
  <div className="text-3xl mb-3">📅</div>
  <div className="font-semibold">Citas</div>
  <div className="text-slate-400 text-sm mt-1">Agenda del día</div>
</a>
<a href="/inventory" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-6 block transition-colors">
  <div className="text-3xl mb-3">📦</div>
  <div className="font-semibold">Inventario</div>
  <div className="text-slate-400 text-sm mt-1">Stock de productos</div>
</a>
{role === 'ADMIN' && (
  <a href="/reports" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-6 block transition-colors">
    <div className="text-3xl mb-3">📊</div>
    <div className="font-semibold">Reportes</div>
    <div className="text-slate-400 text-sm mt-1">PDF mensual</div>
  </a>
)}
```

- [ ] **Step 5: Verificar TypeScript**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/web
npx tsc --noEmit
```

Expected: `TypeScript: No errors found`

- [ ] **Step 6: Commit**

```bash
cd /home/gabriel/Documentos/vetSystem
git add apps/web/src/components/appointments/ apps/web/src/app/appointments/ apps/web/src/app/dashboard/page.tsx
git commit -m "feat: add appointments frontend — weekly list, slot picker, status management"
```

---

## Task 4: Inventory Backend

**Files:**
- Create: `apps/api/src/inventory/dto/create-product.dto.ts`
- Create: `apps/api/src/inventory/dto/update-product.dto.ts`
- Create: `apps/api/src/inventory/dto/create-movement.dto.ts`
- Create: `apps/api/src/inventory/inventory.service.spec.ts`
- Create: `apps/api/src/inventory/inventory.service.ts`
- Create: `apps/api/src/inventory/inventory.controller.ts`
- Create: `apps/api/src/inventory/inventory.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Escribir el test que falla**

`apps/api/src/inventory/inventory.service.spec.ts`:
```typescript
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
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/api
npx jest src/inventory/inventory.service.spec.ts --no-coverage
```

Expected: FAIL — `Cannot find module './inventory.service'`

- [ ] **Step 3: Crear los DTOs**

`apps/api/src/inventory/dto/create-product.dto.ts`:
```typescript
import { IsString, IsInt, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  sku: string;

  @IsString()
  category: string;

  @IsString()
  unit: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  minStock: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costPrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salePrice: number;
}
```

`apps/api/src/inventory/dto/update-product.dto.ts`:
```typescript
import { IsString, IsInt, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsInt() @Min(0) @Type(() => Number) minStock?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) costPrice?: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) salePrice?: number;
}
```

`apps/api/src/inventory/dto/create-movement.dto.ts`:
```typescript
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMovementDto {
  @IsEnum(['IN', 'OUT', 'ADJUSTMENT'])
  type: 'IN' | 'OUT' | 'ADJUSTMENT';

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

- [ ] **Step 4: Crear `apps/api/src/inventory/inventory.service.ts`**

```typescript
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
```

- [ ] **Step 5: Ejecutar el test para verificar que pasa**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/api
npx jest src/inventory/inventory.service.spec.ts --no-coverage
```

Expected: PASS — 5 tests passed.

- [ ] **Step 6: Crear `apps/api/src/inventory/inventory.controller.ts`**

```typescript
import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateMovementDto } from './dto/create-movement.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtPayload, Role } from '@vet/shared-types';

@Controller()
export class InventoryController {
  constructor(private service: InventoryService) {}

  @Get('products')
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.clinicId);
  }

  @Roles(Role.ADMIN)
  @Post('products')
  create(@Body() dto: CreateProductDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user.clinicId);
  }

  @Roles(Role.ADMIN)
  @Patch('products/:id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: JwtPayload) {
    return this.service.update(id, dto, user.clinicId);
  }

  @Roles(Role.ADMIN)
  @Delete('products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.softDelete(id, user.clinicId);
  }

  @Get('products/:id/movements')
  getMovements(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.getMovements(id, user.clinicId);
  }

  @Post('products/:id/movements')
  createMovement(
    @Param('id') id: string,
    @Body() dto: CreateMovementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.createMovement(id, dto, user.sub, user.clinicId);
  }

  @Get('inventory/low-stock')
  getLowStock(@CurrentUser() user: JwtPayload) {
    return this.service.getLowStock(user.clinicId);
  }
}
```

- [ ] **Step 7: Crear `apps/api/src/inventory/inventory.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, PrismaService],
  exports: [InventoryService],
})
export class InventoryModule {}
```

- [ ] **Step 8: Registrar InventoryModule en AppModule**

En `apps/api/src/app.module.ts`, agregar:
```typescript
import { InventoryModule } from './inventory/inventory.module';
// En imports[]:
InventoryModule,
```

- [ ] **Step 9: Verificar todos los tests**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/api
npx jest --no-coverage
```

Expected: todos los tests pasan.

- [ ] **Step 10: Commit**

```bash
cd /home/gabriel/Documentos/vetSystem
git add apps/api/src/inventory/ apps/api/src/app.module.ts
git commit -m "feat: add inventory module with stock movements and low-stock alert"
```

---

## Task 5: Inventory Frontend + Dashboard Badge

**Files:**
- Create: `apps/web/src/components/inventory/product-form.tsx`
- Create: `apps/web/src/components/inventory/movement-form.tsx`
- Create: `apps/web/src/app/inventory/page.tsx`
- Modify: `apps/web/src/app/dashboard/page.tsx`

- [ ] **Step 1: Crear `apps/web/src/components/inventory/product-form.tsx`**

```typescript
'use client';

import { useState, FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

interface Product {
  id: string; name: string; sku: string; category: string; unit: string;
  currentStock: number; minStock: number; costPrice: string; salePrice: string; isActive: boolean;
}

interface Props {
  token: string | null;
  onSuccess: (p: Product) => void;
  onCancel: () => void;
}

export function ProductForm({ token, onSuccess, onCancel }: Props) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('piezas');
  const [minStock, setMinStock] = useState('5');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const product = await apiFetch<Product>('/products', {
        method: 'POST',
        token: token ?? undefined,
        body: { name, sku, category, unit, minStock: Number(minStock), costPrice: Number(costPrice), salePrice: Number(salePrice) },
      });
      onSuccess(product);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al crear producto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-lg p-3">{error}</div>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-300 text-sm mb-1">Nombre *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1">SKU *</label>
          <input value={sku} onChange={(e) => setSku(e.target.value)} required
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-300 text-sm mb-1">Categoría *</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} required
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1">Unidad *</label>
          <input value={unit} onChange={(e) => setUnit(e.target.value)} required
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-slate-300 text-sm mb-1">Stock mínimo</label>
          <input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} min="0"
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1">Precio costo *</label>
          <input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} required min="0" step="0.01"
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1">Precio venta *</label>
          <input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} required min="0" step="0.01"
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-sm transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors">
          {loading ? 'Guardando...' : 'Crear producto'}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Crear `apps/web/src/components/inventory/movement-form.tsx`**

```typescript
'use client';

import { useState, FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api';

interface Props {
  productId: string;
  productName: string;
  token: string | null;
  onSuccess: (newStock: number) => void;
  onCancel: () => void;
}

export function MovementForm({ productId, productName, token, onSuccess, onCancel }: Props) {
  const [type, setType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await apiFetch<{ currentStock: number }>(`/products/${productId}/movements`, {
        method: 'POST',
        token: token ?? undefined,
        body: { type, quantity: Number(quantity), notes: notes || undefined },
      });
      onSuccess(result.currentStock);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al registrar movimiento');
    } finally {
      setLoading(false);
    }
  }

  const TYPE_LABEL = { IN: 'Entrada', OUT: 'Salida', ADJUSTMENT: 'Ajuste' };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-slate-300 text-sm font-medium">{productName}</div>
      {error && <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-lg p-3">{error}</div>}

      <div>
        <label className="block text-slate-300 text-sm mb-1">Tipo</label>
        <div className="flex gap-2">
          {(['IN', 'OUT', 'ADJUSTMENT'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === t ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-slate-300 text-sm mb-1">
          {type === 'ADJUSTMENT' ? 'Nuevo stock total' : 'Cantidad'}
        </label>
        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min="1"
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
      </div>

      <div>
        <label className="block text-slate-300 text-sm mb-1">Notas</label>
        <input value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Opcional"
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-sm transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors">
          {loading ? 'Guardando...' : 'Registrar'}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Crear `apps/web/src/app/inventory/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { apiFetch } from '@/lib/api';
import { ProductForm } from '@/components/inventory/product-form';
import { MovementForm } from '@/components/inventory/movement-form';

interface Product {
  id: string; name: string; sku: string; category: string; unit: string;
  currentStock: number; minStock: number; costPrice: string; salePrice: string; isActive: boolean;
}

export default function InventoryPage() {
  const { user, accessToken, role, ready } = useRequireAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [movementProductId, setMovementProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    apiFetch<Product[]>('/products', { token: accessToken ?? undefined })
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [ready, user, accessToken]);

  const isAdmin = role === 'ADMIN';
  const movementProduct = products.find((p) => p.id === movementProductId);

  if (!ready || !user) return <div className="min-h-screen bg-slate-900" />;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <a href="/dashboard" className="text-slate-400 hover:text-white text-sm">← Dashboard</a>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Inventario</span>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Inventario</h1>
          {isAdmin && (
            <button onClick={() => setShowProductForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              + Nuevo producto
            </button>
          )}
        </div>

        {showProductForm && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
            <h2 className="font-semibold mb-4">Nuevo producto</h2>
            <ProductForm
              token={accessToken}
              onSuccess={(p) => { setProducts((prev) => [p, ...prev]); setShowProductForm(false); }}
              onCancel={() => setShowProductForm(false)}
            />
          </div>
        )}

        {movementProduct && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-sm">
              <h2 className="font-semibold mb-4">Registrar movimiento</h2>
              <MovementForm
                productId={movementProduct.id}
                productName={movementProduct.name}
                token={accessToken}
                onSuccess={(newStock) => {
                  setProducts((prev) => prev.map((p) => p.id === movementProduct.id ? { ...p, currentStock: newStock } : p));
                  setMovementProductId(null);
                }}
                onCancel={() => setMovementProductId(null)}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-slate-400 text-center py-12">Cargando...</div>
        ) : products.length === 0 ? (
          <div className="text-slate-400 text-center py-12">No hay productos registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-left">
                  <th className="pb-3 pr-4">Producto</th>
                  <th className="pb-3 pr-4">SKU</th>
                  <th className="pb-3 pr-4">Categoría</th>
                  <th className="pb-3 pr-4">Stock</th>
                  <th className="pb-3 pr-4">Precio venta</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-slate-800">
                    <td className="py-3 pr-4 font-medium text-white">{p.name}</td>
                    <td className="py-3 pr-4 text-slate-400">{p.sku}</td>
                    <td className="py-3 pr-4 text-slate-400">{p.category}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.currentStock <= p.minStock ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                        {p.currentStock} {p.unit}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-300">${Number(p.salePrice).toFixed(2)}</td>
                    <td className="py-3">
                      <button onClick={() => setMovementProductId(p.id)}
                        className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                        + Movimiento
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Verificar TypeScript**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/web
npx tsc --noEmit
```

Expected: `TypeScript: No errors found`

- [ ] **Step 5: Commit**

```bash
cd /home/gabriel/Documentos/vetSystem
git add apps/web/src/components/inventory/ apps/web/src/app/inventory/
git commit -m "feat: add inventory frontend — product table, product form, movement modal"
```

---

## Task 6: Reports Backend

**Files:**
- Create: `apps/api/src/reports/reports.service.ts`
- Create: `apps/api/src/reports/reports.controller.ts`
- Create: `apps/api/src/reports/reports.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Instalar pdfmake**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/api
npm install pdfmake
npm install --save-dev @types/pdfmake
```

Expected: `added N packages`

- [ ] **Step 2: Crear `apps/api/src/reports/reports.service.ts`**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const FONTS = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

function buildPdfBuffer(docDefinition: object): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PdfPrinter = require('pdfmake') as new (fonts: object) => {
    createPdfKitDocument: (dd: object) => NodeJS.EventEmitter & { end: () => void };
  };
  const printer = new PdfPrinter(FONTS);
  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateCartillaPdf(petId: string): Promise<Buffer> {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      include: {
        owner: { select: { firstName: true, lastName: true } },
        record: {
          include: {
            consultations: {
              orderBy: { createdAt: 'desc' },
              include: { note: true, prescriptions: true, vaccinations: true },
            },
          },
        },
      },
    });
    if (!pet) throw new NotFoundException('Mascota no encontrada');

    const age = pet.birthDate
      ? `${Math.floor((Date.now() - pet.birthDate.getTime()) / 31536000000)} años`
      : 'Desconocida';

    const consultationBlocks: object[] = pet.record?.consultations.flatMap((c) => {
      const blocks: object[] = [
        { text: `Consulta: ${c.reason}`, style: 'consultHeader', margin: [0, 12, 0, 4] },
        { text: new Date(c.createdAt).toLocaleDateString('es-MX'), style: 'subtext' },
      ];
      if (c.note) {
        blocks.push({ text: '📋 Nota médica', style: 'sectionTitle', margin: [0, 8, 0, 2] });
        blocks.push({ text: c.note.title, bold: true, fontSize: 10 });
        blocks.push({ text: c.note.content, fontSize: 10, color: '#555' });
      }
      if (c.prescriptions.length > 0) {
        blocks.push({ text: '💊 Recetas', style: 'sectionTitle', margin: [0, 8, 0, 2] });
        c.prescriptions.forEach((rx) => {
          blocks.push({ text: rx.diagnosis, bold: true, fontSize: 10 });
          blocks.push({ text: `Medicamentos: ${rx.medications}`, fontSize: 10, color: '#555' });
          blocks.push({ text: `Instrucciones: ${rx.instructions}`, fontSize: 10, color: '#555' });
        });
      }
      if (c.vaccinations.length > 0) {
        blocks.push({ text: '💉 Vacunas', style: 'sectionTitle', margin: [0, 8, 0, 2] });
        c.vaccinations.forEach((v) => {
          blocks.push({
            text: `${v.vaccineName}${v.batch ? ` (Lote: ${v.batch})` : ''} — ${new Date(v.appliedAt).toLocaleDateString('es-MX')}`,
            fontSize: 10, color: '#555',
          });
        });
      }
      return blocks;
    }) ?? [];

    const docDefinition = {
      defaultStyle: { font: 'Helvetica', fontSize: 11 },
      styles: {
        header: { fontSize: 20, bold: true, color: '#1e293b' },
        subtext: { fontSize: 10, color: '#64748b' },
        consultHeader: { fontSize: 13, bold: true, color: '#3730a3' },
        sectionTitle: { fontSize: 11, bold: true, color: '#334155' },
      },
      content: [
        { text: 'Cartilla Médica', style: 'header' },
        { text: `Generado el ${new Date().toLocaleDateString('es-MX')}`, style: 'subtext', margin: [0, 2, 0, 16] },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [{ text: 'Mascota', bold: true }, pet.name],
              [{ text: 'Especie', bold: true }, pet.species],
              [{ text: 'Raza', bold: true }, pet.breed ?? '—'],
              [{ text: 'Sexo', bold: true }, pet.sex === 'FEMALE' ? 'Hembra' : 'Macho'],
              [{ text: 'Edad', bold: true }, age],
              [{ text: 'Dueño', bold: true }, `${pet.owner.firstName} ${pet.owner.lastName}`],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 16],
        },
        { text: 'Historial de Consultas', fontSize: 15, bold: true, margin: [0, 0, 0, 8] },
        ...consultationBlocks,
        { text: `\n— Generado por VetSystem —`, style: 'subtext', alignment: 'center', margin: [0, 24, 0, 0] },
      ],
    };

    return buildPdfBuffer(docDefinition);
  }

  async generateMonthlyReport(clinicId: string, month: number, year: number): Promise<Buffer> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const consultations = await this.prisma.consultation.findMany({
      where: { clinicId, createdAt: { gte: startDate, lt: endDate } },
      include: { doctor: { select: { firstName: true, lastName: true } } },
    });

    const byDoctor = new Map<string, { name: string; count: number }>();
    for (const c of consultations) {
      const name = `${c.doctor.firstName} ${c.doctor.lastName}`;
      const prev = byDoctor.get(c.doctorId) ?? { name, count: 0 };
      byDoctor.set(c.doctorId, { name, count: prev.count + 1 });
    }

    const products = await this.prisma.product.findMany({ where: { clinicId, isActive: true } });
    const lowStockProducts = products.filter((p) => p.currentStock <= p.minStock);

    const movements = await this.prisma.stockMovement.findMany({
      where: { clinicId, createdAt: { gte: startDate, lt: endDate } },
      include: { product: { select: { category: true, name: true } } },
    });

    const inByCategory = new Map<string, number>();
    const outByCategory = new Map<string, number>();
    for (const m of movements) {
      const cat = m.product.category;
      if (m.type === 'IN') inByCategory.set(cat, (inByCategory.get(cat) ?? 0) + m.quantity);
      if (m.type === 'OUT') outByCategory.set(cat, (outByCategory.get(cat) ?? 0) + m.quantity);
    }

    const allCategories = [...new Set([...inByCategory.keys(), ...outByCategory.keys()])];
    const monthName = new Date(year, month - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

    const docDefinition = {
      defaultStyle: { font: 'Helvetica', fontSize: 11 },
      styles: {
        header: { fontSize: 20, bold: true, color: '#1e293b' },
        subtext: { fontSize: 10, color: '#64748b' },
        sectionHeader: { fontSize: 14, bold: true, color: '#1e293b', margin: [0, 16, 0, 6] },
      },
      content: [
        { text: 'Reporte Mensual', style: 'header' },
        { text: `${monthName} · Generado el ${new Date().toLocaleDateString('es-MX')}`, style: 'subtext', margin: [0, 2, 0, 16] },

        { text: 'Resumen de Consultas', style: 'sectionHeader' },
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [{ text: 'Métrica', bold: true }, { text: 'Valor', bold: true }],
              ['Total consultas en el mes', String(consultations.length)],
              ['Pacientes únicos atendidos', String(new Set(consultations.map((c) => c.recordId)).size)],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 12],
        },

        { text: 'Consultas por Doctor', style: 'sectionHeader' },
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [{ text: 'Doctor', bold: true }, { text: 'Consultas', bold: true }],
              ...(byDoctor.size === 0
                ? [['Sin consultas', '0']]
                : [...byDoctor.values()].map((d) => [d.name, String(d.count)])),
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 12],
        },

        { text: 'Productos con Stock Bajo', style: 'sectionHeader' },
        {
          table: {
            widths: ['*', 'auto', 'auto'],
            body: [
              [{ text: 'Producto', bold: true }, { text: 'Stock actual', bold: true }, { text: 'Stock mínimo', bold: true }],
              ...(lowStockProducts.length === 0
                ? [['Sin alertas', '', '']]
                : lowStockProducts.map((p) => [p.name, String(p.currentStock), String(p.minStock)])),
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 12],
        },

        { text: 'Movimientos de Inventario por Categoría', style: 'sectionHeader' },
        {
          table: {
            widths: ['*', 'auto', 'auto'],
            body: [
              [{ text: 'Categoría', bold: true }, { text: 'Entradas', bold: true }, { text: 'Salidas', bold: true }],
              ...(allCategories.length === 0
                ? [['Sin movimientos', '0', '0']]
                : allCategories.map((cat) => [cat, String(inByCategory.get(cat) ?? 0), String(outByCategory.get(cat) ?? 0)])),
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 12],
        },

        { text: `\n— Generado por VetSystem —`, style: 'subtext', alignment: 'center', margin: [0, 24, 0, 0] },
      ],
    };

    return buildPdfBuffer(docDefinition);
  }
}
```

- [ ] **Step 3: Crear `apps/api/src/reports/reports.controller.ts`**

```typescript
import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtPayload, Role } from '@vet/shared-types';

@Controller()
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('pets/:id/record/pdf')
  async cartillaPdf(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.service.generateCartillaPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cartilla-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Roles(Role.ADMIN)
  @Get('reports/monthly')
  async monthlyReport(
    @Query('month') month: string,
    @Query('year') year: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    const m = Number(month) || new Date().getMonth() + 1;
    const y = Number(year) || new Date().getFullYear();
    const buffer = await this.service.generateMonthlyReport(user.clinicId, m, y);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reporte-${y}-${String(m).padStart(2, '0')}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
```

- [ ] **Step 4: Crear `apps/api/src/reports/reports.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, PrismaService],
})
export class ReportsModule {}
```

- [ ] **Step 5: Registrar ReportsModule en AppModule**

En `apps/api/src/app.module.ts`, agregar:
```typescript
import { ReportsModule } from './reports/reports.module';
// En imports[]:
ReportsModule,
```

- [ ] **Step 6: Verificar compilación TypeScript del API**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/api
npx tsc --noEmit
```

Expected: `TypeScript: No errors found`

- [ ] **Step 7: Commit**

```bash
cd /home/gabriel/Documentos/vetSystem
git add apps/api/src/reports/ apps/api/src/app.module.ts apps/api/package.json apps/api/package-lock.json
git commit -m "feat: add reports module — cartilla PDF and monthly clinic report using pdfmake"
```

---

## Task 7: Reports Frontend

**Files:**
- Create: `apps/web/src/app/reports/page.tsx`
- Modify: `apps/web/src/app/pets/[id]/record/page.tsx`

- [ ] **Step 1: Crear `apps/web/src/app/reports/page.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function ReportsPage() {
  const { user, accessToken, ready } = useRequireAuth();
  const { role } = useAuthStore();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [loading, setLoading] = useState(false);

  if (!ready || !user) return <div className="min-h-screen bg-slate-900" />;
  if (role !== 'ADMIN') return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-400">
      Solo los administradores pueden ver reportes
    </div>
  );

  async function downloadReport() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/reports/monthly?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Error al generar reporte');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${year}-${month.padStart(2, '0')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  }

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const years = [String(now.getFullYear()), String(now.getFullYear() - 1)];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <a href="/dashboard" className="text-slate-400 hover:text-white text-sm">← Dashboard</a>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Reportes</span>
      </nav>

      <main className="max-w-lg mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-2">Reportes PDF</h1>
        <p className="text-slate-400 text-sm mb-8">Genera un reporte mensual con consultas atendidas, inventario y movimientos de stock.</p>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Reporte mensual de clínica</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-sm mb-1">Mes</label>
              <select value={month} onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                {months.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-1">Año</label>
              <select value={year} onChange={(e) => setYear(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <button onClick={downloadReport} disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg py-3 text-sm transition-colors">
            {loading ? 'Generando...' : '📊 Descargar reporte PDF'}
          </button>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Agregar botón de descarga PDF en la cartilla médica**

En `apps/web/src/app/pets/[id]/record/page.tsx`, agregar en el nav junto al botón QR:

```tsx
<button
  onClick={async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const res = await fetch(`${API_URL}/pets/${petId}/record/pdf`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cartilla-${pet.name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }}
  className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
>
  📄 PDF
</button>
```

Este botón va después del botón `📱 QR` y antes del botón `Ver pública` en el nav de la página `/pets/:id/record`.

- [ ] **Step 3: Verificar TypeScript**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/web
npx tsc --noEmit
```

Expected: `TypeScript: No errors found`

- [ ] **Step 4: Verificar todos los tests del API**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/api
npx jest --no-coverage
```

Expected: todos los tests pasan.

- [ ] **Step 5: Commit final**

```bash
cd /home/gabriel/Documentos/vetSystem
git add apps/web/src/app/reports/ "apps/web/src/app/pets/[id]/record/page.tsx"
git commit -m "feat: add reports frontend — PDF download for cartilla and monthly clinic report"
```
