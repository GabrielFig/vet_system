# VetSystem Sub-proyecto 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the MVP del sistema VetSystem: monorepo con auth multi-tenant, gestión de mascotas, cartilla médica con Consultations agrupadas, y QR público — todo corriendo en docker-compose local.

**Architecture:** Monorepo npm workspaces con `apps/api` (NestJS + Prisma + PostgreSQL + Redis) y `apps/web` (Next.js 14 App Router). Multi-tenancy por `clinicId` en JWT. Cartilla médica global compartida entre clínicas vía `publicUuid`. Vertical slices: cada tarea entrega backend + frontend funcional de un módulo.

**Tech Stack:** NestJS 10 · Prisma 5 · PostgreSQL 16 · Redis 7 · Next.js 14 · TypeScript 5 · Tailwind CSS · shadcn/ui · Zustand · bcrypt · passport-jwt · qrcode · @zxing/browser · Docker Compose

---

## File Map

```
vetSystem/
├── package.json                          # workspace root
├── tsconfig.base.json
├── docker-compose.yml
├── .env.example
├── .gitignore
├── packages/
│   ├── shared-types/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── auth.types.ts
│   │       ├── pet.types.ts
│   │       └── medical-record.types.ts
│   └── utils/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/index.ts
├── apps/
│   ├── api/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   ├── jest.config.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── prisma/
│   │       │   └── prisma.service.ts
│   │       ├── common/
│   │       │   ├── decorators/
│   │       │   │   ├── public.decorator.ts
│   │       │   │   ├── roles.decorator.ts
│   │       │   │   └── current-user.decorator.ts
│   │       │   ├── guards/
│   │       │   │   ├── jwt-auth.guard.ts
│   │       │   │   └── roles.guard.ts
│   │       │   └── interceptors/
│   │       │       └── tenant.interceptor.ts
│   │       ├── auth/
│   │       │   ├── auth.module.ts
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.service.ts
│   │       │   ├── auth.service.spec.ts
│   │       │   ├── strategies/
│   │       │   │   └── jwt.strategy.ts
│   │       │   └── dto/
│   │       │       ├── login.dto.ts
│   │       │       ├── select-clinic.dto.ts
│   │       │       └── refresh-token.dto.ts
│   │       ├── pets/
│   │       │   ├── pets.module.ts
│   │       │   ├── pets.controller.ts
│   │       │   ├── pets.service.ts
│   │       │   ├── pets.service.spec.ts
│   │       │   └── dto/
│   │       │       ├── create-pet.dto.ts
│   │       │       └── update-pet.dto.ts
│   │       ├── medical-records/
│   │       │   ├── medical-records.module.ts
│   │       │   ├── medical-records.controller.ts
│   │       │   ├── medical-records.service.ts
│   │       │   ├── consultations.controller.ts
│   │       │   ├── consultations.service.ts
│   │       │   ├── consultations.service.spec.ts
│   │       │   └── dto/
│   │       │       ├── create-consultation.dto.ts
│   │       │       ├── create-note.dto.ts
│   │       │       ├── create-prescription.dto.ts
│   │       │       ├── create-vaccination.dto.ts
│   │       │       └── search-history.dto.ts
│   │       └── public/
│   │           ├── public.module.ts
│   │           ├── public.controller.ts
│   │           └── public.service.ts
│   └── web/
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── components.json
│       └── src/
│           ├── middleware.ts
│           ├── app/
│           │   ├── layout.tsx
│           │   ├── login/page.tsx
│           │   ├── dashboard/page.tsx
│           │   ├── pets/page.tsx
│           │   ├── pets/[id]/page.tsx
│           │   ├── pets/[id]/record/page.tsx
│           │   └── public/[uuid]/page.tsx
│           ├── store/
│           │   └── auth.store.ts
│           ├── lib/
│           │   ├── api.ts
│           │   └── utils.ts
│           └── components/
│               ├── auth/
│               │   ├── login-form.tsx
│               │   └── clinic-selector.tsx
│               ├── pets/
│               │   ├── pet-card.tsx
│               │   └── pet-form.tsx
│               ├── medical-records/
│               │   ├── consultation-timeline.tsx
│               │   ├── consultation-detail.tsx
│               │   ├── medical-record-tabs.tsx
│               │   ├── new-consultation-form.tsx
│               │   └── qr-modal.tsx
│               └── qr/
│                   └── qr-scanner.tsx
```

---

## Task 1: Monorepo Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `docker-compose.yml`
- Create: `packages/shared-types/package.json`
- Create: `packages/shared-types/tsconfig.json`
- Create: `packages/shared-types/src/index.ts`
- Create: `packages/shared-types/src/auth.types.ts`
- Create: `packages/shared-types/src/pet.types.ts`
- Create: `packages/shared-types/src/medical-record.types.ts`
- Create: `packages/utils/package.json`
- Create: `packages/utils/tsconfig.json`
- Create: `packages/utils/src/index.ts`

- [ ] **Step 1: Crear directorio raíz e inicializar git**

```bash
cd /home/gabriel/Documentos/vetSystem
git init
```

- [ ] **Step 2: Crear `package.json` raíz (workspace root)**

```json
{
  "name": "vetsystem",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:api": "npm run start:dev --workspace=apps/api",
    "dev:web": "npm run dev --workspace=apps/web",
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "db:migrate": "npm run prisma:migrate --workspace=apps/api",
    "db:seed": "npm run prisma:seed --workspace=apps/api",
    "db:studio": "npm run prisma:studio --workspace=apps/api"
  }
}
```

- [ ] **Step 3: Crear `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "target": "ES2022",
    "lib": ["ES2022"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 4: Crear `.gitignore`**

```
node_modules/
dist/
.env
.env.local
*.tsbuildinfo
.next/
.superpowers/
uploads/
```

- [ ] **Step 5: Crear `.env.example`**

```env
# Base de datos
DATABASE_URL=postgresql://vetuser:vetpass@localhost:5432/vetdb

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=dev_secret_change_in_production_min32chars
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
TEMP_TOKEN_EXPIRY=5m

# App
API_PORT=3001
WEB_URL=http://localhost:3000
API_URL=http://localhost:3001

# Almacenamiento local (MVP)
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
```

- [ ] **Step 6: Crear `docker-compose.yml`**

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: vetuser
      POSTGRES_PASSWORD: vetpass
      POSTGRES_DB: vetdb
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U vetuser -d vetdb']
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

- [ ] **Step 7: Crear `packages/shared-types/package.json`**

```json
{
  "name": "@vet/shared-types",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 8: Crear `packages/shared-types/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "module": "CommonJS"
  },
  "include": ["src"]
}
```

- [ ] **Step 9: Crear `packages/shared-types/src/auth.types.ts`**

```typescript
export enum Role {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  OWNER = 'OWNER',
}

export enum PlanType {
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export interface JwtPayload {
  sub: string;
  clinicId: string;
  role: Role;
  email: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthClinic {
  id: string;
  name: string;
  slug: string;
  planType: PlanType;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  clinic: AuthClinic;
  role: Role;
}

export interface ClinicOption {
  id: string;
  name: string;
  slug: string;
  role: Role;
}

export interface ClinicSelectionRequired {
  requiresClinicSelection: true;
  clinics: ClinicOption[];
  tempToken: string;
}

export type LoginResult = AuthResponse | ClinicSelectionRequired;
```

- [ ] **Step 10: Crear `packages/shared-types/src/pet.types.ts`**

```typescript
export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
export type PetSex = 'male' | 'female';

export interface PetOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface PetSummary {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  birthDate: string | null;
  sex: PetSex;
  photoUrl: string | null;
  owner: PetOwner;
  createdAt: string;
}
```

- [ ] **Step 11: Crear `packages/shared-types/src/medical-record.types.ts`**

```typescript
export interface MedicalNoteSummary {
  id: string;
  title: string;
  content: string;
  attachmentUrl: string | null;
  authorId: string;
  clinicId: string;
  clinicName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionSummary {
  id: string;
  diagnosis: string;
  medications: string;
  instructions: string;
  validUntil: string | null;
  doctorId: string;
  clinicId: string;
  createdAt: string;
}

export interface VaccinationSummary {
  id: string;
  vaccineName: string;
  batch: string | null;
  appliedAt: string;
  nextDose: string | null;
  appliedBy: string;
  clinicId: string;
  createdAt: string;
}

export interface ConsultationSummary {
  id: string;
  reason: string;
  clinicId: string;
  clinicName?: string;
  doctorId: string;
  createdAt: string;
  note: MedicalNoteSummary | null;
  prescriptions: PrescriptionSummary[];
  vaccinations: VaccinationSummary[];
}

export interface MedicalRecordDetail {
  id: string;
  petId: string;
  publicUuid: string;
  isPublic: boolean;
  consultations: ConsultationSummary[];
}
```

- [ ] **Step 12: Crear `packages/shared-types/src/index.ts`**

```typescript
export * from './auth.types';
export * from './pet.types';
export * from './medical-record.types';
```

- [ ] **Step 13: Crear `packages/utils/package.json`**

```json
{
  "name": "@vet/utils",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 14: Crear `packages/utils/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "module": "CommonJS"
  },
  "include": ["src"]
}
```

- [ ] **Step 15: Crear `packages/utils/src/index.ts`**

```typescript
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function paginate<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const data = items.slice((page - 1) * limit, page * limit);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
```

- [ ] **Step 16: Instalar dependencias de paquetes compartidos y compilar**

```bash
cd /home/gabriel/Documentos/vetSystem
npm install
cd packages/shared-types && npm run build
cd ../utils && npm run build
```

Expected: ambos paquetes compilan sin errores, aparece carpeta `dist/` en cada uno.

- [ ] **Step 17: Commit inicial**

```bash
cd /home/gabriel/Documentos/vetSystem
git add .
git commit -m "feat: initialize monorepo with shared-types and utils packages"
```

---

## Task 2: Prisma Schema + Docker + Migration

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/jest.config.ts`
- Create: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Crear `apps/api/package.json`**

```json
{
  "name": "@vet/api",
  "version": "1.0.0",
  "scripts": {
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "build": "nest build",
    "test": "jest",
    "test:watch": "jest --watch",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "ts-node prisma/seed.ts",
    "prisma:studio": "prisma studio",
    "prisma:generate": "prisma generate"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/config": "^3.2.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/throttler": "^5.1.0",
    "@prisma/client": "^5.14.0",
    "@vet/shared-types": "*",
    "bcrypt": "^5.1.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "helmet": "^7.1.0",
    "ioredis": "^5.3.2",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "qrcode": "^1.5.3",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@nestjs/testing": "^10.3.0",
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/multer": "^1.4.11",
    "@types/passport-jwt": "^4.0.1",
    "@types/qrcode": "^1.5.5",
    "jest": "^29.7.0",
    "prisma": "^5.14.0",
    "ts-jest": "^29.1.4",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Crear `apps/api/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src",
    "incremental": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "paths": {
      "@vet/shared-types": ["../../packages/shared-types/src"]
    }
  },
  "include": ["src", "prisma"]
}
```

- [ ] **Step 3: Crear `apps/api/nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

- [ ] **Step 4: Crear `apps/api/jest.config.ts`**

```typescript
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '@vet/shared-types': '<rootDir>/../../packages/shared-types/src',
  },
};
```

- [ ] **Step 5: Crear `apps/api/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── ENUMS ────────────────────────────────────────────────
enum Role {
  ADMIN
  DOCTOR
  OWNER
}

enum PlanType {
  BASIC
  PRO
  ENTERPRISE
}

// ── ENTIDADES GLOBALES ────────────────────────────────────

model User {
  id           String       @id @default(uuid())
  email        String       @unique
  passwordHash String
  firstName    String
  lastName     String
  phone        String?
  avatarUrl    String?
  isActive     Boolean      @default(true)
  createdAt    DateTime     @default(now())
  clinics      ClinicUser[]
  pets         Pet[]
}

model Pet {
  id        String        @id @default(uuid())
  ownerId   String
  name      String
  species   String
  breed     String?
  birthDate DateTime?
  sex       String
  photoUrl  String?
  createdAt DateTime      @default(now())
  owner     User          @relation(fields: [ownerId], references: [id])
  record    MedicalRecord?
}

model MedicalRecord {
  id            String         @id @default(uuid())
  petId         String         @unique
  publicUuid    String         @unique @default(uuid())
  qrCodeUrl     String?
  isPublic      Boolean        @default(true)
  createdAt     DateTime       @default(now())
  pet           Pet            @relation(fields: [petId], references: [id])
  consultations Consultation[]
}

model Consultation {
  id            String        @id @default(uuid())
  recordId      String
  clinicId      String
  doctorId      String
  reason        String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  record        MedicalRecord  @relation(fields: [recordId], references: [id])
  note          MedicalNote?
  prescriptions Prescription[]
  vaccinations  Vaccination[]
}

// ── ENTIDADES DE TENANT ───────────────────────────────────

model Clinic {
  id         String       @id @default(uuid())
  name       String
  slug       String       @unique
  licenseKey String       @unique
  planType   PlanType     @default(BASIC)
  logoUrl    String?
  isActive   Boolean      @default(true)
  createdAt  DateTime     @default(now())
  users      ClinicUser[]
}

model ClinicUser {
  id       String   @id @default(uuid())
  clinicId String
  userId   String
  role     Role
  isActive Boolean  @default(true)
  joinedAt DateTime @default(now())
  clinic   Clinic   @relation(fields: [clinicId], references: [id])
  user     User     @relation(fields: [userId], references: [id])

  @@unique([clinicId, userId])
}

model MedicalNote {
  id             String       @id @default(uuid())
  consultationId String       @unique
  clinicId       String
  authorId       String
  title          String
  content        String       @db.Text
  attachmentUrl  String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  consultation   Consultation @relation(fields: [consultationId], references: [id])
}

model Prescription {
  id             String       @id @default(uuid())
  consultationId String
  clinicId       String
  doctorId       String
  diagnosis      String
  medications    String       @db.Text
  instructions   String       @db.Text
  validUntil     DateTime?
  createdAt      DateTime     @default(now())
  consultation   Consultation @relation(fields: [consultationId], references: [id])
}

model Vaccination {
  id             String       @id @default(uuid())
  consultationId String
  clinicId       String
  appliedBy      String
  vaccineName    String
  batch          String?
  appliedAt      DateTime
  nextDose       DateTime?
  createdAt      DateTime     @default(now())
  consultation   Consultation @relation(fields: [consultationId], references: [id])
}
```

- [ ] **Step 6: Levantar servicios de base de datos**

```bash
cd /home/gabriel/Documentos/vetSystem
cp .env.example apps/api/.env
docker compose up -d postgres redis
```

Esperar 5 segundos y verificar:
```bash
docker compose ps
```
Expected: postgres y redis en estado `healthy`.

- [ ] **Step 7: Instalar dependencias de la API y ejecutar migración**

```bash
cd apps/api
npm install
DATABASE_URL=postgresql://vetuser:vetpass@localhost:5432/vetdb npx prisma migrate dev --name init
```

Expected: `Your database is now in sync with your schema.` y se crea carpeta `prisma/migrations/`.

- [ ] **Step 8: Generar cliente Prisma**

```bash
DATABASE_URL=postgresql://vetuser:vetpass@localhost:5432/vetdb npx prisma generate
```

Expected: `Generated Prisma Client`.

- [ ] **Step 9: Commit**

```bash
cd /home/gabriel/Documentos/vetSystem
git add apps/api/
git commit -m "feat: add NestJS api scaffold with complete Prisma schema and initial migration"
```

---

## Task 3: Seed Script

**Files:**
- Create: `apps/api/prisma/seed.ts`

- [ ] **Step 1: Crear `apps/api/prisma/seed.ts`**

```typescript
import { PrismaClient, Role, PlanType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clínicas
  const canesClinic = await prisma.clinic.upsert({
    where: { slug: 'canes' },
    update: {},
    create: {
      name: 'Canes Vet',
      slug: 'canes',
      licenseKey: 'CANES-2026-LICENSE',
      planType: PlanType.PRO,
    },
  });

  const mininosClinic = await prisma.clinic.upsert({
    where: { slug: 'mininos' },
    update: {},
    create: {
      name: 'Mininos Vet',
      slug: 'mininos',
      licenseKey: 'MININOS-2026-LICENSE',
      planType: PlanType.BASIC,
    },
  });

  const hash = (pw: string) => bcrypt.hash(pw, 12);

  // Admin de Canes
  const canesAdmin = await prisma.user.upsert({
    where: { email: 'admin@canes.com' },
    update: {},
    create: {
      email: 'admin@canes.com',
      passwordHash: await hash('Admin1234!'),
      firstName: 'Carlos',
      lastName: 'Mendoza',
    },
  });

  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: canesClinic.id, userId: canesAdmin.id } },
    update: {},
    create: { clinicId: canesClinic.id, userId: canesAdmin.id, role: Role.ADMIN },
  });

  // Doctor de Canes
  const canesDoctor = await prisma.user.upsert({
    where: { email: 'doctor@canes.com' },
    update: {},
    create: {
      email: 'doctor@canes.com',
      passwordHash: await hash('Doctor1234!'),
      firstName: 'Roberto',
      lastName: 'García',
    },
  });

  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: canesClinic.id, userId: canesDoctor.id } },
    update: {},
    create: { clinicId: canesClinic.id, userId: canesDoctor.id, role: Role.DOCTOR },
  });

  // Admin de Mininos
  const mininosAdmin = await prisma.user.upsert({
    where: { email: 'admin@mininos.com' },
    update: {},
    create: {
      email: 'admin@mininos.com',
      passwordHash: await hash('Admin1234!'),
      firstName: 'Laura',
      lastName: 'Sánchez',
    },
  });

  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: mininosClinic.id, userId: mininosAdmin.id } },
    update: {},
    create: { clinicId: mininosClinic.id, userId: mininosAdmin.id, role: Role.ADMIN },
  });

  // Doctor de Mininos
  const mininosDoctor = await prisma.user.upsert({
    where: { email: 'doctor@mininos.com' },
    update: {},
    create: {
      email: 'doctor@mininos.com',
      passwordHash: await hash('Doctor1234!'),
      firstName: 'Elena',
      lastName: 'López',
    },
  });

  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: mininosClinic.id, userId: mininosDoctor.id } },
    update: {},
    create: { clinicId: mininosClinic.id, userId: mininosDoctor.id, role: Role.DOCTOR },
  });

  // Owner con 2 mascotas
  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo.com' },
    update: {},
    create: {
      email: 'owner@demo.com',
      passwordHash: await hash('Owner1234!'),
      firstName: 'Ana',
      lastName: 'Rodríguez',
    },
  });

  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: canesClinic.id, userId: owner.id } },
    update: {},
    create: { clinicId: canesClinic.id, userId: owner.id, role: Role.OWNER },
  });

  // Mascota 1: Luna
  const luna = await prisma.pet.upsert({
    where: { id: 'seed-luna-pet-id-00000000000000000001' },
    update: {},
    create: {
      id: 'seed-luna-pet-id-00000000000000000001',
      ownerId: owner.id,
      name: 'Luna',
      species: 'dog',
      breed: 'Labrador',
      sex: 'female',
      birthDate: new Date('2023-03-15'),
    },
  });

  const lunaRecord = await prisma.medicalRecord.upsert({
    where: { petId: luna.id },
    update: {},
    create: { petId: luna.id },
  });

  // Consultation 1 de Luna (Canes Vet)
  const lunaConsult1 = await prisma.consultation.upsert({
    where: { id: 'seed-luna-consult1-000000000000000001' },
    update: {},
    create: {
      id: 'seed-luna-consult1-000000000000000001',
      recordId: lunaRecord.id,
      clinicId: canesClinic.id,
      doctorId: canesDoctor.id,
      reason: 'Revisión general',
      createdAt: new Date('2026-05-05'),
    },
  });

  await prisma.medicalNote.upsert({
    where: { consultationId: lunaConsult1.id },
    update: {},
    create: {
      consultationId: lunaConsult1.id,
      clinicId: canesClinic.id,
      authorId: canesDoctor.id,
      title: 'Revisión general',
      content: 'Paciente en buen estado general. Peso 28kg. Sin alteraciones en auscultación cardiopulmonar. Mucosas rosadas. Temperatura normal.',
    },
  });

  await prisma.prescription.create({
    data: {
      consultationId: lunaConsult1.id,
      clinicId: canesClinic.id,
      doctorId: canesDoctor.id,
      diagnosis: 'Paciente sano en revisión preventiva',
      medications: 'Vitamina E 400mg — 1 cápsula diaria por 30 días',
      instructions: 'Administrar con comida. Guardar en lugar fresco y seco.',
      validUntil: new Date('2026-06-05'),
    },
  });

  await prisma.vaccination.create({
    data: {
      consultationId: lunaConsult1.id,
      clinicId: canesClinic.id,
      appliedBy: canesDoctor.id,
      vaccineName: 'Antirrábica',
      batch: 'RABV-2026-001',
      appliedAt: new Date('2026-05-05'),
      nextDose: new Date('2027-05-05'),
    },
  });

  // Consultation 2 de Luna (Mininos Vet)
  const lunaConsult2 = await prisma.consultation.upsert({
    where: { id: 'seed-luna-consult2-000000000000000002' },
    update: {},
    create: {
      id: 'seed-luna-consult2-000000000000000002',
      recordId: lunaRecord.id,
      clinicId: mininosClinic.id,
      doctorId: mininosDoctor.id,
      reason: 'Control de peso',
      createdAt: new Date('2026-04-12'),
    },
  });

  await prisma.medicalNote.upsert({
    where: { consultationId: lunaConsult2.id },
    update: {},
    create: {
      consultationId: lunaConsult2.id,
      clinicId: mininosClinic.id,
      authorId: mininosDoctor.id,
      title: 'Control de peso mensual',
      content: 'Peso estable en 28kg. Se recomienda reducir porción diaria de alimento balanceado a 300g. Próxima cita en 30 días.',
    },
  });

  // Mascota 2: Michi
  const michi = await prisma.pet.upsert({
    where: { id: 'seed-michi-pet-id-00000000000000000002' },
    update: {},
    create: {
      id: 'seed-michi-pet-id-00000000000000000002',
      ownerId: owner.id,
      name: 'Michi',
      species: 'cat',
      breed: 'Siamés',
      sex: 'male',
      birthDate: new Date('2022-07-20'),
    },
  });

  await prisma.medicalRecord.upsert({
    where: { petId: michi.id },
    update: {},
    create: { petId: michi.id },
  });

  console.log('✅ Seed completo.');
  console.log('');
  console.log('Usuarios demo:');
  console.log('  admin@canes.com    / Admin1234!  (ADMIN  en Canes Vet)');
  console.log('  doctor@canes.com   / Doctor1234! (DOCTOR en Canes Vet)');
  console.log('  admin@mininos.com  / Admin1234!  (ADMIN  en Mininos Vet)');
  console.log('  doctor@mininos.com / Doctor1234! (DOCTOR en Mininos Vet)');
  console.log('  owner@demo.com     / Owner1234!  (OWNER  en Canes Vet)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Agregar script de seed a `apps/api/package.json`**

En `apps/api/package.json`, el script `prisma:seed` ya está incluido. También añadir en `package.json` raíz la config de prisma:

Agregar al `apps/api/package.json`:
```json
"prisma": {
  "seed": "ts-node --project tsconfig.json prisma/seed.ts"
}
```

- [ ] **Step 3: Ejecutar seed**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/api
DATABASE_URL=postgresql://vetuser:vetpass@localhost:5432/vetdb npx ts-node --project tsconfig.json prisma/seed.ts
```

Expected:
```
🌱 Seeding database...
✅ Seed completo.

Usuarios demo:
  admin@canes.com    / Admin1234!  (ADMIN  en Canes Vet)
  doctor@canes.com   / Doctor1234! (DOCTOR en Canes Vet)
  ...
```

- [ ] **Step 4: Verificar datos en la DB**

```bash
DATABASE_URL=postgresql://vetuser:vetpass@localhost:5432/vetdb npx prisma studio
```

Abrir `http://localhost:5555`, verificar que existan 5 usuarios, 2 clínicas, 2 mascotas y 2 consultations para Luna.

- [ ] **Step 5: Commit**

```bash
cd /home/gabriel/Documentos/vetSystem
git add apps/api/prisma/seed.ts apps/api/package.json
git commit -m "feat: add demo seed with 2 clinics, 5 users, 2 pets and sample consultations"
```

---

## Task 4: NestJS Core — PrismaService + App Bootstrap

**Files:**
- Create: `apps/api/src/prisma/prisma.service.ts`
- Create: `apps/api/src/common/decorators/public.decorator.ts`
- Create: `apps/api/src/common/decorators/roles.decorator.ts`
- Create: `apps/api/src/common/decorators/current-user.decorator.ts`
- Create: `apps/api/src/common/guards/jwt-auth.guard.ts`
- Create: `apps/api/src/common/guards/roles.guard.ts`
- Create: `apps/api/src/common/interceptors/tenant.interceptor.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/main.ts`

- [ ] **Step 1: Crear `apps/api/src/prisma/prisma.service.ts`**

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

- [ ] **Step 2: Crear `apps/api/src/common/decorators/public.decorator.ts`**

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

- [ ] **Step 3: Crear `apps/api/src/common/decorators/roles.decorator.ts`**

```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '@vet/shared-types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

- [ ] **Step 4: Crear `apps/api/src/common/decorators/current-user.decorator.ts`**

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '@vet/shared-types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtPayload;
  },
);
```

- [ ] **Step 5: Crear `apps/api/src/common/guards/jwt-auth.guard.ts`**

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

- [ ] **Step 6: Crear `apps/api/src/common/guards/roles.guard.ts`**

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, JwtPayload } from '@vet/shared-types';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('No tienes permisos para realizar esta acción');
    }
    return true;
  }
}
```

- [ ] **Step 7: Crear `apps/api/src/common/interceptors/tenant.interceptor.ts`**

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtPayload } from '@vet/shared-types';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ user?: JwtPayload; clinicId?: string }>();
    if (request.user?.clinicId) {
      request.clinicId = request.user.clinicId;
    }
    return next.handle();
  }
}
```

- [ ] **Step 8: Crear `apps/api/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaService } from './prisma/prisma.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { AuthModule } from './auth/auth.module';
import { PetsModule } from './pets/pets.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { PublicModule } from './public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    PetsModule,
    MedicalRecordsModule,
    PublicModule,
  ],
  providers: [
    PrismaService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
  ],
  exports: [PrismaService],
})
export class AppModule {}
```

- [ ] **Step 9: Crear `apps/api/src/main.ts`**

```typescript
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.API_PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}`);
}

bootstrap();
```

- [ ] **Step 10: Verificar que la API arranca**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/api
DATABASE_URL=postgresql://vetuser:vetpass@localhost:5432/vetdb REDIS_URL=redis://localhost:6379 JWT_SECRET=dev_secret_change_in_production_min32chars npx nest start
```

Expected: `🚀 API running on http://localhost:3001` (puede fallar en módulos no creados aún — está bien, se completará en tareas siguientes).

- [ ] **Step 11: Commit**

```bash
cd /home/gabriel/Documentos/vetSystem
git add apps/api/src/
git commit -m "feat: add NestJS core bootstrap with guards, interceptors and PrismaService"
```

---

## Task 5: Auth Backend

**Files:**
- Create: `apps/api/src/auth/strategies/jwt.strategy.ts`
- Create: `apps/api/src/auth/dto/login.dto.ts`
- Create: `apps/api/src/auth/dto/select-clinic.dto.ts`
- Create: `apps/api/src/auth/dto/refresh-token.dto.ts`
- Create: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/auth.service.spec.ts`
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/auth.module.ts`

- [ ] **Step 1: Escribir el test que falla — `apps/api/src/auth/auth.service.spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@vet/shared-types';
import * as bcrypt from 'bcrypt';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  clinicUser: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn(),
};

const mockRedis = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('retorna AuthResponse cuando el usuario pertenece a 1 clínica', async () => {
      const passwordHash = await bcrypt.hash('Test1234!', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
      });
      mockPrisma.clinicUser.findMany.mockResolvedValue([
        {
          clinicId: 'clinic-1',
          role: Role.DOCTOR,
          clinic: { id: 'clinic-1', name: 'Canes Vet', slug: 'canes', planType: 'PRO' },
        },
      ]);
      mockJwt.sign.mockReturnValue('access-token');

      const result = await service.login({ email: 'test@test.com', password: 'Test1234!' });

      expect('accessToken' in result).toBe(true);
      if ('accessToken' in result) {
        expect(result.accessToken).toBeDefined();
        expect(result.role).toBe(Role.DOCTOR);
      }
    });

    it('retorna ClinicSelectionRequired cuando el usuario pertenece a N clínicas', async () => {
      const passwordHash = await bcrypt.hash('Test1234!', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
      });
      mockPrisma.clinicUser.findMany.mockResolvedValue([
        { clinicId: 'clinic-1', role: Role.DOCTOR, clinic: { id: 'clinic-1', name: 'Canes', slug: 'canes', planType: 'PRO' } },
        { clinicId: 'clinic-2', role: Role.ADMIN, clinic: { id: 'clinic-2', name: 'Mininos', slug: 'mininos', planType: 'BASIC' } },
      ]);

      const result = await service.login({ email: 'test@test.com', password: 'Test1234!' });

      expect('requiresClinicSelection' in result).toBe(true);
      if ('requiresClinicSelection' in result) {
        expect(result.clinics).toHaveLength(2);
        expect(result.tempToken).toBeDefined();
      }
    });

    it('lanza UnauthorizedException con credenciales inválidas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexiste@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el usuario está inactivo', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: await bcrypt.hash('Test1234!', 12),
        firstName: 'Test',
        lastName: 'User',
        isActive: false,
      });

      await expect(
        service.login({ email: 'test@test.com', password: 'Test1234!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/api
npx jest src/auth/auth.service.spec.ts --no-coverage
```

Expected: FAIL — `Cannot find module './auth.service'`

- [ ] **Step 3: Crear `apps/api/src/auth/dto/login.dto.ts`**

```typescript
import { IsEmail, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;
}
```

- [ ] **Step 4: Crear `apps/api/src/auth/dto/select-clinic.dto.ts`**

```typescript
import { IsString, IsUUID } from 'class-validator';

export class SelectClinicDto {
  @IsString()
  tempToken: string;

  @IsUUID()
  clinicId: string;
}
```

- [ ] **Step 5: Crear `apps/api/src/auth/dto/refresh-token.dto.ts`**

```typescript
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}
```

- [ ] **Step 6: Crear `apps/api/src/auth/strategies/jwt.strategy.ts`**

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@vet/shared-types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    if (!payload.sub || !payload.clinicId) {
      throw new UnauthorizedException('TOKEN_EXPIRED');
    }
    return payload;
  }
}
```

- [ ] **Step 7: Crear `apps/api/src/auth/auth.service.ts`**

```typescript
import {
  Injectable,
  UnauthorizedException,
  Inject,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  JwtPayload,
  AuthResponse,
  ClinicSelectionRequired,
  LoginResult,
  Role,
} from '@vet/shared-types';
import { LoginDto } from './dto/login.dto';
import { SelectClinicDto } from './dto/select-clinic.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    @Inject('REDIS_CLIENT') private redis: Redis,
  ) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const clinicUsers = await this.prisma.clinicUser.findMany({
      where: { userId: user.id, isActive: true },
      include: { clinic: true },
    });

    if (clinicUsers.length === 0) {
      throw new UnauthorizedException('El usuario no está asociado a ninguna clínica activa');
    }

    if (clinicUsers.length === 1) {
      return this.buildAuthResponse(user, clinicUsers[0].clinic, clinicUsers[0].role as Role);
    }

    // Múltiples clínicas — retornar temp token
    const tempToken = this.jwt.sign(
      { sub: user.id, type: 'clinic-selection' },
      { expiresIn: this.config.get('TEMP_TOKEN_EXPIRY', '5m') },
    );

    const response: ClinicSelectionRequired = {
      requiresClinicSelection: true,
      clinics: clinicUsers.map((cu) => ({
        id: cu.clinic.id,
        name: cu.clinic.name,
        slug: cu.clinic.slug,
        role: cu.role as Role,
      })),
      tempToken,
    };
    return response;
  }

  async selectClinic(dto: SelectClinicDto): Promise<AuthResponse> {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwt.verify(dto.tempToken) as { sub: string; type: string };
    } catch {
      throw new UnauthorizedException('Token de selección inválido o expirado');
    }

    if (payload.type !== 'clinic-selection') {
      throw new UnauthorizedException('Token inválido');
    }

    const clinicUser = await this.prisma.clinicUser.findUnique({
      where: { clinicId_userId: { clinicId: dto.clinicId, userId: payload.sub } },
      include: { user: true, clinic: true },
    });

    if (!clinicUser || !clinicUser.isActive) {
      throw new UnauthorizedException('Acceso denegado a esta clínica');
    }

    return this.buildAuthResponse(clinicUser.user, clinicUser.clinic, clinicUser.role as Role);
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const isBlacklisted = await this.redis.get(`bl:${refreshToken}`);
    if (isBlacklisted) throw new UnauthorizedException('TOKEN_EXPIRED');

    let payload: JwtPayload;
    try {
      payload = this.jwt.verify(refreshToken) as JwtPayload;
    } catch {
      throw new UnauthorizedException('TOKEN_EXPIRED');
    }

    const accessToken = this.signAccess(payload);
    return { accessToken };
  }

  async logout(refreshToken: string): Promise<void> {
    const ttlSeconds = 7 * 24 * 60 * 60;
    await this.redis.set(`bl:${refreshToken}`, '1', 'EX', ttlSeconds);
  }

  private buildAuthResponse(
    user: { id: string; email: string; firstName: string; lastName: string },
    clinic: { id: string; name: string; slug: string; planType: string },
    role: Role,
  ): AuthResponse {
    const jwtPayload: JwtPayload = {
      sub: user.id,
      clinicId: clinic.id,
      role,
      email: user.email,
    };

    const accessToken = this.signAccess(jwtPayload);
    const refreshToken = this.jwt.sign(jwtPayload, {
      expiresIn: this.config.get('REFRESH_TOKEN_EXPIRY', '7d'),
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email },
      clinic: { id: clinic.id, name: clinic.name, slug: clinic.slug, planType: clinic.planType },
      role,
    };
  }

  private signAccess(payload: JwtPayload): string {
    return this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRY', '15m'),
    });
  }
}
```

- [ ] **Step 8: Ejecutar el test para verificar que pasa**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/api
npx jest src/auth/auth.service.spec.ts --no-coverage
```

Expected: PASS — 4 tests passed.

- [ ] **Step 9: Crear `apps/api/src/auth/auth.controller.ts`**

```typescript
import { Controller, Post, Body, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SelectClinicDto } from './dto/select-clinic.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '@vet/shared-types';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('select-clinic')
  @HttpCode(HttpStatus.OK)
  selectClinic(@Body() dto: SelectClinicDto) {
    return this.authService.selectClinic(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return user;
  }
}
```

- [ ] **Step 10: Crear `apps/api/src/auth/auth.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    PrismaService,
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Redis(config.getOrThrow<string>('REDIS_URL')),
    },
  ],
  exports: [AuthService, 'REDIS_CLIENT'],
})
export class AuthModule {}
```

- [ ] **Step 11: Verificar que la API arranca con AuthModule**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/api
DATABASE_URL=postgresql://vetuser:vetpass@localhost:5432/vetdb \
REDIS_URL=redis://localhost:6379 \
JWT_SECRET=dev_secret_change_in_production_min32chars \
npx nest start --entryFile main 2>&1 | head -20
```

Expected: línea con `🚀 API running on http://localhost:3001`

- [ ] **Step 12: Probar login con curl**

```bash
curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@canes.com","password":"Doctor1234!"}' | python3 -m json.tool
```

Expected: JSON con `accessToken`, `refreshToken`, `user`, `clinic`, `role: "DOCTOR"`.

- [ ] **Step 13: Commit**

```bash
cd /home/gabriel/Documentos/vetSystem
git add apps/api/src/auth/
git commit -m "feat: add auth module with JWT login, clinic selection, refresh and logout"
```

---

## Task 6: Next.js Web App + Auth Frontend

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/components.json`
- Create: `apps/web/src/middleware.ts`
- Create: `apps/web/src/store/auth.store.ts`
- Create: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/lib/utils.ts`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/login/page.tsx`
- Create: `apps/web/src/components/auth/login-form.tsx`
- Create: `apps/web/src/components/auth/clinic-selector.tsx`
- Create: `apps/web/src/app/dashboard/page.tsx`

- [ ] **Step 1: Crear `apps/web/package.json`**

```json
{
  "name": "@vet/web",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@vet/shared-types": "*",
    "@zxing/browser": "^0.1.5",
    "@zxing/library": "^0.21.3",
    "next": "14.2.3",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zustand": "^4.5.2",
    "qrcode": "^1.5.3",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0",
    "lucide-react": "^0.383.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-badge": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/qrcode": "^1.5.5",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Crear `apps/web/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@vet/shared-types": ["../../packages/shared-types/src"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Crear `apps/web/next.config.ts`**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@vet/shared-types', '@vet/utils'],
};

export default nextConfig;
```

- [ ] **Step 4: Crear `apps/web/tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: Crear `apps/web/postcss.config.js`**

```javascript
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

- [ ] **Step 6: Crear `apps/web/src/lib/utils.ts`**

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 7: Crear `apps/web/src/lib/api.ts`**

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown; token?: string } = {},
): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Error desconocido' }));
    if (res.status === 401) {
      const msg = (data as { message?: string }).message ?? 'No autorizado';
      throw new ApiError(401, msg);
    }
    throw new ApiError(res.status, (data as { message?: string }).message ?? 'Error del servidor');
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
```

- [ ] **Step 8: Crear `apps/web/src/store/auth.store.ts`**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, AuthClinic, Role } from '@vet/shared-types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  clinic: AuthClinic | null;
  role: Role | null;
  setAuth: (data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
    clinic: AuthClinic;
    role: Role;
  }) => void;
  clearAuth: () => void;
  updateAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      clinic: null,
      role: null,
      setAuth: (data) =>
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
          clinic: data.clinic,
          role: data.role,
        }),
      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, user: null, clinic: null, role: null }),
      updateAccessToken: (token) => set({ accessToken: token }),
    }),
    { name: 'vet-auth' },
  ),
);
```

- [ ] **Step 9: Crear `apps/web/src/middleware.ts`**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/public'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Leer token del localStorage no es posible en middleware (server-side).
  // El guard real lo hace el cliente; aquí solo redirigimos si no hay cookie de sesión.
  // Para el MVP, la protección real es client-side vía useAuthStore.
  return NextResponse.next();
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
```

- [ ] **Step 10: Crear `apps/web/src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VetSystem',
  description: 'Sistema de gestión veterinaria',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 11: Crear `apps/web/src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 12: Crear `apps/web/src/components/auth/login-form.tsx`**

```typescript
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  LoginResult,
  AuthResponse,
  ClinicSelectionRequired,
} from '@vet/shared-types';
import { ClinicSelector } from './clinic-selector';

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [clinicSelection, setClinicSelection] = useState<ClinicSelectionRequired | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await apiFetch<LoginResult>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if ('requiresClinicSelection' in result) {
        setClinicSelection(result);
      } else {
        const auth = result as AuthResponse;
        setAuth(auth);
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  if (clinicSelection) {
    return <ClinicSelector data={clinicSelection} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐾</div>
          <h1 className="text-2xl font-bold text-white">VetSystem</h1>
          <p className="text-slate-400 text-sm mt-1">Accede a tu clínica</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-8 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-300 text-sm mb-1.5">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="doctor@clinica.com"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 13: Crear `apps/web/src/components/auth/clinic-selector.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { ClinicSelectionRequired, AuthResponse } from '@vet/shared-types';

export function ClinicSelector({ data }: { data: ClinicSelectionRequired }) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function select(clinicId: string) {
    setError('');
    setLoading(true);
    try {
      const result = await apiFetch<AuthResponse>('/auth/select-clinic', {
        method: 'POST',
        body: { tempToken: data.tempToken, clinicId },
      });
      setAuth(result);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al seleccionar clínica');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm bg-slate-800 rounded-xl p-8">
        <h2 className="text-white font-semibold text-center mb-1">¿Desde qué clínica trabajas hoy?</h2>
        <p className="text-slate-400 text-sm text-center mb-6">Tu cuenta está asociada a más de una clínica</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {data.clinics.map((clinic) => (
            <button
              key={clinic.id}
              onClick={() => select(clinic.id)}
              disabled={loading}
              className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-indigo-500 text-left rounded-xl p-4 flex items-center gap-4 transition-colors disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-xl">🏥</div>
              <div className="flex-1">
                <div className="text-white font-medium text-sm">{clinic.name}</div>
                <div className="text-slate-400 text-xs mt-0.5">Rol: {clinic.role}</div>
              </div>
              <span className="text-slate-400">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 14: Crear `apps/web/src/app/login/page.tsx`**

```typescript
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return <LoginForm />;
}
```

- [ ] **Step 15: Crear `apps/web/src/app/dashboard/page.tsx`**

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function DashboardPage() {
  const router = useRouter();
  const { user, clinic, role, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🐾</span>
          <div>
            <div className="font-bold">VetSystem</div>
            <div className="text-slate-400 text-xs">{clinic?.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href="/pets" className="text-slate-300 hover:text-white text-sm">Mascotas</a>
          <button onClick={() => { clearAuth(); router.push('/login'); }} className="text-slate-400 hover:text-white text-sm">
            Salir
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-2">
          Bienvenido, {user.firstName} {user.lastName}
        </h1>
        <p className="text-slate-400 mb-8">
          {clinic?.name} · Rol: <span className="text-indigo-400">{role}</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/pets" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-6 block transition-colors">
            <div className="text-3xl mb-3">🐾</div>
            <div className="font-semibold">Mascotas</div>
            <div className="text-slate-400 text-sm mt-1">Ver y gestionar pacientes</div>
          </a>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 16: Instalar dependencias del web y levantar en dev**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/web
npm install
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev
```

Expected: `▲ Next.js 14.x.x — Local: http://localhost:3000`

- [ ] **Step 17: Verificar flujo de login en el navegador**

Abrir `http://localhost:3000/login`. Ingresar `doctor@canes.com` / `Doctor1234!`. Verificar redirección a `/dashboard` con nombre y clínica correctos.

- [ ] **Step 18: Commit**

```bash
cd /home/gabriel/Documentos/vetSystem
git add apps/web/
git commit -m "feat: add Next.js web app with auth login flow, Zustand store and dashboard"
```

---

## Task 7: Pets Backend

**Files:**
- Create: `apps/api/src/pets/dto/create-pet.dto.ts`
- Create: `apps/api/src/pets/dto/update-pet.dto.ts`
- Create: `apps/api/src/pets/pets.service.ts`
- Create: `apps/api/src/pets/pets.service.spec.ts`
- Create: `apps/api/src/pets/pets.controller.ts`
- Create: `apps/api/src/pets/pets.module.ts`

- [ ] **Step 1: Escribir el test que falla — `apps/api/src/pets/pets.service.spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@vet/shared-types';

const mockPrisma = {
  pet: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  medicalRecord: {
    create: jest.fn(),
  },
  $transaction: jest.fn((fn: (tx: typeof mockPrisma) => unknown) => fn(mockPrisma)),
};

describe('PetsService', () => {
  let service: PetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PetsService>(PetsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('OWNER solo ve sus propias mascotas', async () => {
      mockPrisma.pet.findMany.mockResolvedValue([]);
      await service.findAll('user-owner', 'clinic-1', Role.OWNER);
      expect(mockPrisma.pet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ ownerId: 'user-owner' }) }),
      );
    });

    it('DOCTOR ve todas las mascotas (sin filtro de owner)', async () => {
      mockPrisma.pet.findMany.mockResolvedValue([]);
      await service.findAll('user-doctor', 'clinic-1', Role.DOCTOR);
      const call = mockPrisma.pet.findMany.mock.calls[0][0];
      expect(call.where).not.toHaveProperty('ownerId');
    });
  });

  describe('create', () => {
    it('crea mascota y su MedicalRecord en una transacción', async () => {
      const mockPet = { id: 'pet-1', name: 'Luna', ownerId: 'user-1' };
      mockPrisma.pet.create.mockResolvedValue(mockPet);
      mockPrisma.medicalRecord.create.mockResolvedValue({ id: 'record-1' });

      const result = await service.create(
        { name: 'Luna', species: 'dog', sex: 'female' },
        'user-1',
      );

      expect(result).toEqual(mockPet);
      expect(mockPrisma.medicalRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ petId: 'pet-1' }) }),
      );
    });
  });

  describe('remove', () => {
    it('lanza ForbiddenException si el usuario no es ADMIN', async () => {
      await expect(service.remove('pet-1', Role.DOCTOR)).rejects.toThrow(ForbiddenException);
    });

    it('lanza NotFoundException si la mascota no existe', async () => {
      mockPrisma.pet.findUnique.mockResolvedValue(null);
      await expect(service.remove('pet-1', Role.ADMIN)).rejects.toThrow(NotFoundException);
    });
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/api
npx jest src/pets/pets.service.spec.ts --no-coverage
```

Expected: FAIL — `Cannot find module './pets.service'`

- [ ] **Step 3: Crear `apps/api/src/pets/dto/create-pet.dto.ts`**

```typescript
import { IsString, IsEnum, IsOptional, IsISO8601 } from 'class-validator';
import { PetSpecies, PetSex } from '@vet/shared-types';

export class CreatePetDto {
  @IsString()
  name: string;

  @IsEnum(['dog', 'cat', 'bird', 'rabbit', 'other'])
  species: PetSpecies;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsISO8601()
  birthDate?: string;

  @IsEnum(['male', 'female'])
  sex: PetSex;
}
```

- [ ] **Step 4: Crear `apps/api/src/pets/dto/update-pet.dto.ts`**

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreatePetDto } from './create-pet.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePetDto extends PartialType(CreatePetDto) {
  @IsOptional()
  @IsString()
  photoUrl?: string;
}
```

- [ ] **Step 5: Crear `apps/api/src/pets/pets.service.ts`**

```typescript
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { Role } from '@vet/shared-types';

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
          sex: dto.sex,
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
        sex: dto.sex,
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
```

- [ ] **Step 6: Ejecutar el test para verificar que pasa**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/api
npx jest src/pets/pets.service.spec.ts --no-coverage
```

Expected: PASS — 5 tests passed.

- [ ] **Step 7: Crear `apps/api/src/pets/pets.controller.ts`**

```typescript
import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload, Role } from '@vet/shared-types';

@Controller('pets')
export class PetsController {
  constructor(private petsService: PetsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.petsService.findAll(user.sub, user.clinicId, user.role);
  }

  @Post()
  create(@Body() dto: CreatePetDto, @CurrentUser() user: JwtPayload) {
    return this.petsService.create(dto, user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.petsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePetDto) {
    return this.petsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.petsService.remove(id, user.role as Role);
  }
}
```

- [ ] **Step 8: Crear `apps/api/src/pets/pets.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PetsController],
  providers: [PetsService, PrismaService],
})
export class PetsModule {}
```

- [ ] **Step 9: Probar el endpoint con curl**

Obtener token:
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@canes.com","password":"Doctor1234!"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

curl -s http://localhost:3001/pets \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

Expected: JSON array con las mascotas del seed (Luna y Michi).

- [ ] **Step 10: Commit**

```bash
cd /home/gabriel/Documentos/vetSystem
git add apps/api/src/pets/
git commit -m "feat: add pets module with CRUD, owner filtering and auto-created MedicalRecord"
```

---

## Task 8: Pets Frontend

**Files:**
- Create: `apps/web/src/components/pets/pet-card.tsx`
- Create: `apps/web/src/components/pets/pet-form.tsx`
- Create: `apps/web/src/app/pets/page.tsx`
- Create: `apps/web/src/app/pets/[id]/page.tsx`

- [ ] **Step 1: Crear `apps/web/src/components/pets/pet-card.tsx`**

```typescript
import Link from 'next/link';
import { PetSummary } from '@vet/shared-types';

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐶', cat: '🐱', bird: '🐦', rabbit: '🐰', other: '🐾',
};

export function PetCard({ pet }: { pet: PetSummary }) {
  const age = pet.birthDate
    ? `${Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / 31536000000)} años`
    : 'Edad desconocida';

  return (
    <Link href={`/pets/${pet.id}`} className="block bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500 rounded-xl p-5 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
          {pet.photoUrl ? (
            <img src={pet.photoUrl} alt={pet.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            SPECIES_EMOJI[pet.species] ?? '🐾'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white">{pet.name}</div>
          <div className="text-slate-400 text-sm truncate">
            {pet.breed ?? pet.species} · {pet.sex === 'female' ? 'Hembra' : 'Macho'} · {age}
          </div>
          <div className="text-slate-500 text-xs mt-0.5">
            Dueño: {pet.owner.firstName} {pet.owner.lastName}
          </div>
        </div>
        <span className="text-slate-500">›</span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Crear `apps/web/src/components/pets/pet-form.tsx`**

```typescript
'use client';

import { useState, FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { PetSummary } from '@vet/shared-types';

interface PetFormProps {
  onSuccess: (pet: PetSummary) => void;
  onCancel: () => void;
}

export function PetForm({ onSuccess, onCancel }: PetFormProps) {
  const token = useAuthStore((s) => s.accessToken);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('dog');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState('male');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const pet = await apiFetch<PetSummary>('/pets', {
        method: 'POST',
        token: token ?? undefined,
        body: { name, species, breed: breed || undefined, sex, birthDate: birthDate || undefined },
      });
      onSuccess(pet);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al crear mascota');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-lg p-3">{error}</div>}

      <div>
        <label className="block text-slate-300 text-sm mb-1">Nombre *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-300 text-sm mb-1">Especie *</label>
          <select value={species} onChange={(e) => setSpecies(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
            <option value="dog">Perro</option>
            <option value="cat">Gato</option>
            <option value="bird">Ave</option>
            <option value="rabbit">Conejo</option>
            <option value="other">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-300 text-sm mb-1">Sexo *</label>
          <select value={sex} onChange={(e) => setSex(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
            <option value="male">Macho</option>
            <option value="female">Hembra</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-slate-300 text-sm mb-1">Raza</label>
        <input value={breed} onChange={(e) => setBreed(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          placeholder="Opcional" />
      </div>

      <div>
        <label className="block text-slate-300 text-sm mb-1">Fecha de nacimiento</label>
        <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-sm transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors">
          {loading ? 'Guardando...' : 'Crear mascota'}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Crear `apps/web/src/app/pets/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { apiFetch } from '@/lib/api';
import { PetSummary } from '@vet/shared-types';
import { PetCard } from '@/components/pets/pet-card';
import { PetForm } from '@/components/pets/pet-form';

export default function PetsPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const [pets, setPets] = useState<PetSummary[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    apiFetch<PetSummary[]>('/pets', { token: accessToken ?? undefined })
      .then(setPets)
      .finally(() => setLoading(false));
  }, [user, accessToken, router]);

  const filtered = pets.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.breed ?? '').toLowerCase().includes(search.toLowerCase()) ||
      `${p.owner.firstName} ${p.owner.lastName}`.toLowerCase().includes(search.toLowerCase()),
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <a href="/dashboard" className="text-slate-400 hover:text-white text-sm">← Dashboard</a>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Mascotas</span>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Mascotas</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + Nueva mascota
          </button>
        </div>

        {showForm && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
            <h2 className="font-semibold mb-4">Nueva mascota</h2>
            <PetForm
              onSuccess={(pet) => { setPets((prev) => [pet as unknown as PetSummary, ...prev]); setShowForm(false); }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Buscar por nombre, raza o dueño..."
          className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-indigo-500"
        />

        {loading ? (
          <div className="text-slate-400 text-center py-12">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-slate-400 text-center py-12">No se encontraron mascotas</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((pet) => <PetCard key={pet.id} pet={pet} />)}
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Crear `apps/web/src/app/pets/[id]/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { apiFetch } from '@/lib/api';

interface PetDetail {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string;
  birthDate: string | null;
  photoUrl: string | null;
  owner: { id: string; firstName: string; lastName: string; email: string };
  record: { id: string; publicUuid: string; isPublic: boolean } | null;
}

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐶', cat: '🐱', bird: '🐦', rabbit: '🐰', other: '🐾',
};

export default function PetDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, accessToken } = useAuthStore();
  const [pet, setPet] = useState<PetDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    apiFetch<PetDetail>(`/pets/${id}`, { token: accessToken ?? undefined })
      .then(setPet)
      .finally(() => setLoading(false));
  }, [user, id, accessToken, router]);

  if (!user || loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Cargando...</div>;
  if (!pet) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-400">Mascota no encontrada</div>;

  const age = pet.birthDate
    ? `${Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / 31536000000)} años`
    : 'Edad desconocida';

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <a href="/pets" className="text-slate-400 hover:text-white text-sm">← Mascotas</a>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-4">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center text-4xl flex-shrink-0">
              {SPECIES_EMOJI[pet.species] ?? '🐾'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{pet.name}</h1>
              <p className="text-slate-400 text-sm mt-1">
                {pet.breed ?? pet.species} · {pet.sex === 'female' ? 'Hembra' : 'Macho'} · {age}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Dueño: {pet.owner.firstName} {pet.owner.lastName}
              </p>
            </div>
          </div>
        </div>

        {pet.record && (
          <Link
            href={`/pets/${pet.id}/record`}
            className="block bg-indigo-600 hover:bg-indigo-700 text-white text-center font-semibold rounded-xl p-4 transition-colors"
          >
            📋 Ver cartilla médica
          </Link>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Verificar flujo en navegador**

Ir a `http://localhost:3000/pets`. Verificar que se muestran Luna y Michi. Hacer clic en Luna y ver el botón "Ver cartilla médica".

- [ ] **Step 6: Commit**

```bash
cd /home/gabriel/Documentos/vetSystem
git add apps/web/src/components/pets/ apps/web/src/app/pets/
git commit -m "feat: add pets list, detail and creation form in Next.js frontend"
```

---

## Task 9: Medical Records Backend

**Files:**
- Create: `apps/api/src/medical-records/dto/create-consultation.dto.ts`
- Create: `apps/api/src/medical-records/dto/create-note.dto.ts`
- Create: `apps/api/src/medical-records/dto/create-prescription.dto.ts`
- Create: `apps/api/src/medical-records/dto/create-vaccination.dto.ts`
- Create: `apps/api/src/medical-records/dto/search-history.dto.ts`
- Create: `apps/api/src/medical-records/consultations.service.ts`
- Create: `apps/api/src/medical-records/consultations.service.spec.ts`
- Create: `apps/api/src/medical-records/medical-records.service.ts`
- Create: `apps/api/src/medical-records/medical-records.controller.ts`
- Create: `apps/api/src/medical-records/consultations.controller.ts`
- Create: `apps/api/src/medical-records/medical-records.module.ts`

- [ ] **Step 1: Escribir el test que falla — `apps/api/src/medical-records/consultations.service.spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@vet/shared-types';

const mockPrisma = {
  consultation: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  medicalNote: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  prescription: { create: jest.fn() },
  vaccination: { create: jest.fn() },
};

describe('ConsultationsService', () => {
  let service: ConsultationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ConsultationsService>(ConsultationsService);
    jest.clearAllMocks();
  });

  describe('createNote', () => {
    it('lanza ConflictException si la consulta ya tiene nota', async () => {
      mockPrisma.medicalNote.findUnique.mockResolvedValue({ id: 'note-1' });
      await expect(
        service.createNote('consult-1', { title: 'T', content: 'C' }, 'user-1', 'clinic-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('crea nota cuando no existe una previa', async () => {
      mockPrisma.medicalNote.findUnique.mockResolvedValue(null);
      mockPrisma.medicalNote.create.mockResolvedValue({ id: 'note-1', title: 'T' });
      const result = await service.createNote('consult-1', { title: 'T', content: 'C' }, 'user-1', 'clinic-1');
      expect(result.id).toBe('note-1');
    });
  });

  describe('deleteNote', () => {
    it('lanza ForbiddenException si el rol no es ADMIN', async () => {
      await expect(
        service.deleteNote('note-1', Role.DOCTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lanza NotFoundException si la nota no existe', async () => {
      mockPrisma.medicalNote.findUnique.mockResolvedValue(null);
      await expect(
        service.deleteNote('note-1', Role.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('elimina la nota si el rol es ADMIN y existe', async () => {
      mockPrisma.medicalNote.findUnique.mockResolvedValue({ id: 'note-1' });
      mockPrisma.medicalNote.delete.mockResolvedValue({ id: 'note-1' });
      await expect(service.deleteNote('note-1', Role.ADMIN)).resolves.not.toThrow();
    });
  });
});
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/api
npx jest src/medical-records/consultations.service.spec.ts --no-coverage
```

Expected: FAIL — `Cannot find module './consultations.service'`

- [ ] **Step 3: Crear los DTOs**

`apps/api/src/medical-records/dto/create-consultation.dto.ts`:
```typescript
import { IsString, MinLength } from 'class-validator';

export class CreateConsultationDto {
  @IsString()
  @MinLength(3)
  reason: string;
}
```

`apps/api/src/medical-records/dto/create-note.dto.ts`:
```typescript
import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(10)
  content: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
```

`apps/api/src/medical-records/dto/create-prescription.dto.ts`:
```typescript
import { IsString, IsOptional, IsISO8601 } from 'class-validator';

export class CreatePrescriptionDto {
  @IsString()
  diagnosis: string;

  @IsString()
  medications: string;

  @IsString()
  instructions: string;

  @IsOptional()
  @IsISO8601()
  validUntil?: string;
}
```

`apps/api/src/medical-records/dto/create-vaccination.dto.ts`:
```typescript
import { IsString, IsISO8601, IsOptional } from 'class-validator';

export class CreateVaccinationDto {
  @IsString()
  vaccineName: string;

  @IsOptional()
  @IsString()
  batch?: string;

  @IsISO8601()
  appliedAt: string;

  @IsOptional()
  @IsISO8601()
  nextDose?: string;
}
```

`apps/api/src/medical-records/dto/search-history.dto.ts`:
```typescript
import { IsOptional, IsString, IsISO8601 } from 'class-validator';

export class SearchHistoryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
```

- [ ] **Step 4: Crear `apps/api/src/medical-records/consultations.service.ts`**

```typescript
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
    appliedBy: string,
    clinicId: string,
  ) {
    return this.prisma.vaccination.create({
      data: {
        consultationId,
        clinicId,
        appliedBy,
        vaccineName: dto.vaccineName,
        batch: dto.batch,
        appliedAt: new Date(dto.appliedAt),
        nextDose: dto.nextDose ? new Date(dto.nextDose) : undefined,
      },
    });
  }
}
```

- [ ] **Step 5: Ejecutar el test para verificar que pasa**

```bash
cd /home/gabriel/Documentos/vetSystem/apps/api
npx jest src/medical-records/consultations.service.spec.ts --no-coverage
```

Expected: PASS — 5 tests passed.

- [ ] **Step 6: Crear `apps/api/src/medical-records/medical-records.service.ts`**

```typescript
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
}
```

- [ ] **Step 7: Crear `apps/api/src/medical-records/medical-records.controller.ts`**

```typescript
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MedicalRecordsService } from './medical-records.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { SearchHistoryDto } from './dto/search-history.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '@vet/shared-types';

@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private service: MedicalRecordsService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/consultations')
  createConsultation(
    @Param('id') id: string,
    @Body() dto: CreateConsultationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.createConsultation(id, dto, user.sub, user.clinicId);
  }

  @Get(':id/notes')
  searchNotes(@Param('id') id: string, @Query() dto: SearchHistoryDto) {
    return this.service.searchNotes(id, dto);
  }

  @Get(':id/prescriptions')
  searchPrescriptions(@Param('id') id: string, @Query() dto: SearchHistoryDto) {
    return this.service.searchPrescriptions(id, dto);
  }

  @Get(':id/vaccinations')
  searchVaccinations(@Param('id') id: string, @Query() dto: SearchHistoryDto) {
    return this.service.searchVaccinations(id, dto);
  }
}
```

- [ ] **Step 8: Crear `apps/api/src/medical-records/consultations.controller.ts`**

```typescript
import {
  Controller, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { CreateVaccinationDto } from './dto/create-vaccination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtPayload, Role } from '@vet/shared-types';

@Controller('consultations')
export class ConsultationsController {
  constructor(private service: ConsultationsService) {}

  @Post(':id/note')
  createNote(
    @Param('id') id: string,
    @Body() dto: CreateNoteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.createNote(id, dto, user.sub, user.clinicId);
  }

  @Patch('notes/:noteId')
  updateNote(
    @Param('noteId') noteId: string,
    @Body() dto: Partial<CreateNoteDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateNote(noteId, dto, user.sub, user.role as Role);
  }

  @Delete('notes/:noteId')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNote(@Param('noteId') noteId: string, @CurrentUser() user: JwtPayload) {
    return this.service.deleteNote(noteId, user.role as Role);
  }

  @Post(':id/prescriptions')
  createPrescription(
    @Param('id') id: string,
    @Body() dto: CreatePrescriptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.createPrescription(id, dto, user.sub, user.clinicId);
  }

  @Post(':id/vaccinations')
  createVaccination(
    @Param('id') id: string,
    @Body() dto: CreateVaccinationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.createVaccination(id, dto, user.sub, user.clinicId);
  }
}
```

- [ ] **Step 9: Crear `apps/api/src/medical-records/medical-records.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecordsService } from './medical-records.service';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MedicalRecordsController, ConsultationsController],
  providers: [MedicalRecordsService, ConsultationsService, PrismaService],
  exports: [MedicalRecordsService],
})
export class MedicalRecordsModule {}
```

- [ ] **Step 10: Probar con curl**

```bash
# Obtener el recordId de Luna desde el seed
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@canes.com","password":"Doctor1234!"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

RECORD_ID=$(curl -s http://localhost:3001/pets/seed-luna-pet-id-00000000000000000001 \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['record']['id'])")

curl -s http://localhost:3001/medical-records/$RECORD_ID \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -40
```

Expected: JSON con `consultations` array conteniendo 2 entradas (una de Canes, una de Mininos).

- [ ] **Step 11: Commit**

```bash
cd /home/gabriel/Documentos/vetSystem
git add apps/api/src/medical-records/
git commit -m "feat: add medical records module with consultations, notes, prescriptions, vaccinations and history search"
```

---

## Task 10: Medical Records Frontend

**Files:**
- Create: `apps/web/src/components/medical-records/consultation-timeline.tsx`
- Create: `apps/web/src/components/medical-records/consultation-detail.tsx`
- Create: `apps/web/src/components/medical-records/medical-record-tabs.tsx`
- Create: `apps/web/src/components/medical-records/new-consultation-form.tsx`
- Create: `apps/web/src/app/pets/[id]/record/page.tsx`

- [ ] **Step 1: Crear `apps/web/src/components/medical-records/consultation-detail.tsx`**

```typescript
'use client';

import { ConsultationSummary } from '@vet/shared-types';
import { useState } from 'react';

export function ConsultationDetail({ consultation }: { consultation: ConsultationSummary }) {
  const [open, setOpen] = useState(false);
  const { note, prescriptions, vaccinations } = consultation;
  const totalItems = (note ? 1 : 0) + prescriptions.length + vaccinations.length;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-start gap-4 text-left hover:bg-slate-750 transition-colors"
      >
        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-white text-sm">{consultation.reason}</span>
            <span className="text-slate-500 text-xs flex-shrink-0">
              {new Date(consultation.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {note && <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded-full">1 nota</span>}
            {prescriptions.length > 0 && <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full">{prescriptions.length} receta{prescriptions.length > 1 ? 's' : ''}</span>}
            {vaccinations.length > 0 && <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full">{vaccinations.length} vacuna{vaccinations.length > 1 ? 's' : ''}</span>}
            {totalItems === 0 && <span className="text-slate-500 text-xs">Sin registros aún</span>}
          </div>
        </div>
        <span className="text-slate-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-slate-700 p-4 space-y-4">
          {note && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">📋 Nota médica</h4>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="font-medium text-white text-sm mb-1">{note.title}</div>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
              </div>
            </div>
          )}

          {prescriptions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">💊 Recetas</h4>
              <div className="space-y-2">
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="bg-slate-700/50 rounded-lg p-3">
                    <div className="font-medium text-white text-sm mb-1">{rx.diagnosis}</div>
                    <p className="text-slate-300 text-sm"><strong>Medicamentos:</strong> {rx.medications}</p>
                    <p className="text-slate-300 text-sm"><strong>Instrucciones:</strong> {rx.instructions}</p>
                    {rx.validUntil && <p className="text-slate-400 text-xs mt-1">Válida hasta: {new Date(rx.validUntil).toLocaleDateString('es-MX')}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {vaccinations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">💉 Vacunas</h4>
              <div className="space-y-2">
                {vaccinations.map((vac) => (
                  <div key={vac.id} className="bg-slate-700/50 rounded-lg p-3">
                    <div className="font-medium text-white text-sm">{vac.vaccineName}</div>
                    {vac.batch && <p className="text-slate-400 text-xs">Lote: {vac.batch}</p>}
                    <p className="text-slate-400 text-xs">Aplicada: {new Date(vac.appliedAt).toLocaleDateString('es-MX')}</p>
                    {vac.nextDose && <p className="text-slate-400 text-xs">Próxima dosis: {new Date(vac.nextDose).toLocaleDateString('es-MX')}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Crear `apps/web/src/components/medical-records/consultation-timeline.tsx`**

```typescript
import { ConsultationSummary } from '@vet/shared-types';
import { ConsultationDetail } from './consultation-detail';

export function ConsultationTimeline({ consultations }: { consultations: ConsultationSummary[] }) {
  if (consultations.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <div className="text-4xl mb-3">📋</div>
        <p>No hay consultas registradas aún</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {consultations.map((c) => (
        <ConsultationDetail key={c.id} consultation={c} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Crear `apps/web/src/components/medical-records/medical-record-tabs.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { MedicalNoteSummary, PrescriptionSummary, VaccinationSummary } from '@vet/shared-types';

type Tab = 'notes' | 'prescriptions' | 'vaccinations';

interface Props {
  recordId: string;
  token: string | null;
}

export function MedicalRecordTabs({ recordId, token }: Props) {
  const [tab, setTab] = useState<Tab>('notes');
  const [q, setQ] = useState('');
  const [results, setResults] = useState<(MedicalNoteSummary | PrescriptionSummary | VaccinationSummary)[]>([]);
  const [loading, setLoading] = useState(false);

  const tabEndpoints: Record<Tab, string> = {
    notes: `/medical-records/${recordId}/notes`,
    prescriptions: `/medical-records/${recordId}/prescriptions`,
    vaccinations: `/medical-records/${recordId}/vaccinations`,
  };

  async function search() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    const data = await apiFetch<(MedicalNoteSummary | PrescriptionSummary | VaccinationSummary)[]>(
      `${tabEndpoints[tab]}?${params}`,
      { token: token ?? undefined },
    ).catch(() => []);
    setResults(data);
    setLoading(false);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'notes', label: '📋 Notas' },
    { key: 'prescriptions', label: '💊 Recetas' },
    { key: 'vaccinations', label: '💉 Vacunas' },
  ];

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-3 text-white">Búsqueda en historial</h2>
      <div className="flex gap-2 mb-4 border-b border-slate-700">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setResults([]); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Buscar término..."
          className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={search}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          Buscar
        </button>
      </div>

      {loading && <div className="text-slate-400 text-sm">Buscando...</div>}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((item) => (
            <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm">
              {'title' in item && <div className="font-medium text-white">{item.title}</div>}
              {'diagnosis' in item && <div className="font-medium text-white">{item.diagnosis}</div>}
              {'vaccineName' in item && <div className="font-medium text-white">{item.vaccineName}</div>}
              {'content' in item && <p className="text-slate-400 text-xs mt-1 line-clamp-2">{item.content}</p>}
              {'medications' in item && <p className="text-slate-400 text-xs mt-1">{item.medications}</p>}
              <div className="text-slate-500 text-xs mt-1">
                {'createdAt' in item && new Date(item.createdAt).toLocaleDateString('es-MX')}
                {'appliedAt' in item && new Date(item.appliedAt).toLocaleDateString('es-MX')}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && q && (
        <div className="text-slate-400 text-sm">No se encontraron resultados para "{q}"</div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Crear `apps/web/src/components/medical-records/new-consultation-form.tsx`**

```typescript
'use client';

import { useState, FormEvent } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { ConsultationSummary } from '@vet/shared-types';

interface Props {
  recordId: string;
  token: string | null;
  onSuccess: (c: ConsultationSummary) => void;
  onCancel: () => void;
}

export function NewConsultationForm({ recordId, token, onSuccess, onCancel }: Props) {
  const [reason, setReason] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const consultation = await apiFetch<ConsultationSummary>(
        `/medical-records/${recordId}/consultations`,
        { method: 'POST', token: token ?? undefined, body: { reason } },
      );

      if (noteTitle && noteContent) {
        await apiFetch(`/consultations/${consultation.id}/note`, {
          method: 'POST',
          token: token ?? undefined,
          body: { title: noteTitle, content: noteContent },
        });
      }

      onSuccess(consultation);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al crear consulta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-lg p-3">{error}</div>}

      <div>
        <label className="block text-slate-300 text-sm mb-1">Motivo de consulta *</label>
        <input value={reason} onChange={(e) => setReason(e.target.value)} required
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          placeholder="Ej: Revisión general, vacunación, malestar..." />
      </div>

      <div className="border-t border-slate-700 pt-4">
        <p className="text-slate-400 text-xs mb-3">Nota médica (opcional — puedes agregarla después)</p>
        <div className="space-y-3">
          <div>
            <label className="block text-slate-300 text-sm mb-1">Título de la nota</label>
            <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-1">Contenido</label>
            <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows={4}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none" />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-sm transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2 text-sm transition-colors">
          {loading ? 'Guardando...' : 'Crear consulta'}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: Crear `apps/web/src/app/pets/[id]/record/page.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { apiFetch } from '@/lib/api';
import { MedicalRecordDetail, ConsultationSummary } from '@vet/shared-types';
import { ConsultationTimeline } from '@/components/medical-records/consultation-timeline';
import { MedicalRecordTabs } from '@/components/medical-records/medical-record-tabs';
import { NewConsultationForm } from '@/components/medical-records/new-consultation-form';

interface PetWithRecord {
  id: string;
  name: string;
  species: string;
  record: { id: string; publicUuid: string; isPublic: boolean } | null;
}

export default function MedicalRecordPage() {
  const router = useRouter();
  const { id: petId } = useParams<{ id: string }>();
  const { user, accessToken, role } = useAuthStore();
  const [pet, setPet] = useState<PetWithRecord | null>(null);
  const [record, setRecord] = useState<MedicalRecordDetail | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    apiFetch<PetWithRecord>(`/pets/${petId}`, { token: accessToken ?? undefined })
      .then(async (p) => {
        setPet(p);
        if (p.record) {
          const r = await apiFetch<MedicalRecordDetail>(`/medical-records/${p.record.id}`, { token: accessToken ?? undefined });
          setRecord(r);
        }
      })
      .finally(() => setLoading(false));
  }, [user, petId, accessToken, router]);

  const canEdit = role === 'ADMIN' || role === 'DOCTOR';

  if (!user || loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Cargando...</div>;
  if (!pet || !record) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-400">No se encontró la cartilla</div>;

  function handleConsultationCreated(c: ConsultationSummary) {
    setRecord((prev) => prev ? { ...prev, consultations: [c, ...prev.consultations] } : prev);
    setShowForm(false);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <Link href={`/pets/${petId}`} className="text-slate-400 hover:text-white text-sm">← {pet.name}</Link>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Cartilla médica</span>
        <div className="ml-auto flex gap-2">
          <Link
            href={`/public/${record.publicUuid}`}
            target="_blank"
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            📱 Ver pública
          </Link>
          {canEdit && (
            <button
              onClick={() => setShowForm(true)}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              + Nueva consulta
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold mb-6">Cartilla de {pet.name}</h1>

        {showForm && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
            <h2 className="font-semibold mb-4">Nueva consulta</h2>
            <NewConsultationForm
              recordId={record.id}
              token={accessToken}
              onSuccess={handleConsultationCreated}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        <ConsultationTimeline consultations={record.consultations as ConsultationSummary[]} />

        <MedicalRecordTabs recordId={record.id} token={accessToken} />
      </main>
    </div>
  );
}
```

- [ ] **Step 6: Verificar en el navegador**

Ir a `http://localhost:3000/pets`, hacer clic en Luna → "Ver cartilla médica". Verificar que se muestran las 2 consultations del seed. Hacer clic en cada una para ver los acordeones con nota, receta y vacuna.

- [ ] **Step 7: Commit**

```bash
cd /home/gabriel/Documentos/vetSystem
git add apps/web/src/components/medical-records/ apps/web/src/app/pets/
git commit -m "feat: add medical record frontend with consultation timeline, tabs and new consultation form"
```

---

## Task 11: QR Backend + Vista Pública

**Files:**
- Create: `apps/api/src/public/public.service.ts`
- Create: `apps/api/src/public/public.controller.ts`
- Create: `apps/api/src/public/public.module.ts`
- Modify: `apps/api/src/medical-records/medical-records.service.ts` (agregar generación de QR)
- Modify: `apps/api/src/medical-records/medical-records.controller.ts` (agregar endpoint QR)

- [ ] **Step 1: Crear `apps/api/src/public/public.service.ts`**

```typescript
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
          include: {
            owner: { select: { firstName: true, lastName: true } },
          },
        },
        consultations: {
          where: {},
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
```

- [ ] **Step 2: Crear `apps/api/src/public/public.controller.ts`**

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { PublicService } from './public.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('public')
export class PublicController {
  constructor(private publicService: PublicService) {}

  @Public()
  @Get(':uuid')
  getRecord(@Param('uuid') uuid: string) {
    return this.publicService.getPublicRecord(uuid);
  }
}
```

- [ ] **Step 3: Crear `apps/api/src/public/public.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PublicController],
  providers: [PublicService, PrismaService],
})
export class PublicModule {}
```

- [ ] **Step 4: Agregar generación de QR al MedicalRecordsService**

Agregar al final de `apps/api/src/medical-records/medical-records.service.ts`:

```typescript
import * as QRCode from 'qrcode';
import { ConfigService } from '@nestjs/config';

// Agregar ConfigService al constructor:
// constructor(private prisma: PrismaService, private config: ConfigService) {}

  async generateQr(recordId: string, webUrl: string): Promise<{ qrCodeUrl: string; publicUuid: string }> {
    const record = await this.prisma.medicalRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundException('Cartilla no encontrada');

    const publicUrl = `${webUrl}/public/${record.publicUuid}`;
    const qrDataUrl = await QRCode.toDataURL(publicUrl, { width: 300, margin: 2 });

    const updated = await this.prisma.medicalRecord.update({
      where: { id: recordId },
      data: { qrCodeUrl: qrDataUrl },
    });

    return { qrCodeUrl: updated.qrCodeUrl!, publicUuid: updated.publicUuid };
  }
```

- [ ] **Step 5: Agregar endpoint QR al MedicalRecordsController**

Agregar a `apps/api/src/medical-records/medical-records.controller.ts`:

```typescript
  @Post(':id/qr')
  generateQr(@Param('id') id: string) {
    const webUrl = process.env.WEB_URL ?? 'http://localhost:3000';
    return this.service.generateQr(id, webUrl);
  }
```

- [ ] **Step 6: Verificar endpoint público con curl**

```bash
# Obtener el publicUuid de la cartilla de Luna
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@canes.com","password":"Doctor1234!"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

RECORD_ID=$(curl -s http://localhost:3001/pets/seed-luna-pet-id-00000000000000000001 \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['record']['id'])")

PUBLIC_UUID=$(curl -s http://localhost:3001/medical-records/$RECORD_ID \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['publicUuid'])")

# Acceder sin token
curl -s http://localhost:3001/public/$PUBLIC_UUID | python3 -m json.tool | head -20
```

Expected: JSON con datos de Luna y sus consultations, sin requerir Authorization header.

- [ ] **Step 7: Commit**

```bash
cd /home/gabriel/Documentos/vetSystem
git add apps/api/src/public/ apps/api/src/medical-records/
git commit -m "feat: add public cartilla endpoint (no auth) and QR generation"
```

---

## Task 12: QR Frontend + Vista Pública

**Files:**
- Create: `apps/web/src/components/qr/qr-scanner.tsx`
- Create: `apps/web/src/components/medical-records/qr-modal.tsx`
- Create: `apps/web/src/app/public/[uuid]/page.tsx`

- [ ] **Step 1: Crear `apps/web/src/components/qr/qr-scanner.tsx`**

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export function QRScanner({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [manualUuid, setManualUuid] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    let reader: { decodeFromVideoDevice: (deviceId: null, video: HTMLVideoElement, callback: (result: { getText: () => string } | null, err: unknown) => void) => { stop: () => void } } | null = null;

    async function startScanner() {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        const codeReader = new BrowserQRCodeReader();
        reader = codeReader;
        if (videoRef.current) {
          await codeReader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
            if (result) {
              const text = result.getText();
              // Extraer UUID de la URL o usar directamente
              const match = text.match(/\/public\/([a-f0-9-]{36})/);
              const uuid = match ? match[1] : text;
              router.push(`/public/${uuid}`);
            }
          });
        }
      } catch (e) {
        setError('No se pudo acceder a la cámara');
      }
    }

    startScanner();
    return () => {
      if (reader) (reader as unknown as { reset: () => void }).reset?.();
    };
  }, [router]);

  function handleManualSubmit() {
    const uuid = manualUuid.trim();
    if (!uuid) return;
    router.push(`/public/${uuid}`);
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Escanear QR</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm rounded-lg p-3 mb-4">{error}</div>
        ) : (
          <div className="bg-black rounded-xl overflow-hidden aspect-square mb-4 relative">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-indigo-500 rounded-lg" />
            </div>
          </div>
        )}

        <div className="border-t border-slate-700 pt-4">
          <p className="text-slate-400 text-xs mb-2">— o ingresa el UUID manualmente —</p>
          <div className="flex gap-2">
            <input
              value={manualUuid}
              onChange={(e) => setManualUuid(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleManualSubmit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Ir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear `apps/web/src/components/medical-records/qr-modal.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface QRModalProps {
  recordId: string;
  publicUuid: string;
  onClose: () => void;
}

export function QRModal({ recordId, publicUuid, onClose }: QRModalProps) {
  const token = useAuthStore((s) => s.accessToken);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/public/${publicUuid}`;

  async function generateQr() {
    setLoading(true);
    const result = await apiFetch<{ qrCodeUrl: string }>(`/medical-records/${recordId}/qr`, {
      method: 'POST',
      token: token ?? undefined,
    }).catch(() => null);
    if (result) setQrDataUrl(result.qrCodeUrl);
    setLoading(false);
  }

  function copyLink() {
    navigator.clipboard.writeText(publicUrl);
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Compartir cartilla</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        {qrDataUrl ? (
          <div className="text-center">
            <img src={qrDataUrl} alt="QR de la cartilla" className="w-48 h-48 mx-auto rounded-lg" />
            <p className="text-slate-400 text-xs mt-3 break-all">{publicUrl}</p>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">📱</div>
            <p className="text-slate-400 text-sm">Genera el código QR para compartir esta cartilla</p>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={copyLink}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg py-2 transition-colors"
          >
            Copiar enlace
          </button>
          <button
            onClick={generateQr}
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2 transition-colors"
          >
            {loading ? 'Generando...' : qrDataUrl ? 'Regenerar QR' : 'Generar QR'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Crear `apps/web/src/app/public/[uuid]/page.tsx`**

```typescript
import { notFound } from 'next/navigation';

interface PublicNote { title: string; content: string; createdAt: string; clinicId: string }
interface PublicPrescription { diagnosis: string; medications: string; instructions: string; validUntil: string | null; clinicId: string; createdAt: string }
interface PublicVaccination { vaccineName: string; batch: string | null; appliedAt: string; nextDose: string | null; clinicId: string }
interface PublicConsultation {
  id: string;
  reason: string;
  clinicId: string;
  createdAt: string;
  note: PublicNote | null;
  prescriptions: PublicPrescription[];
  vaccinations: PublicVaccination[];
}
interface PublicRecord {
  id: string;
  publicUuid: string;
  pet: {
    name: string;
    species: string;
    breed: string | null;
    sex: string;
    birthDate: string | null;
    owner: { firstName: string; lastName: string };
  };
  consultations: PublicConsultation[];
}

const SPECIES_EMOJI: Record<string, string> = { dog: '🐶', cat: '🐱', bird: '🐦', rabbit: '🐰', other: '🐾' };

async function getRecord(uuid: string): Promise<PublicRecord | null> {
  const API_URL = process.env.API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${API_URL}/public/${uuid}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PublicCartillaPage({ params }: { params: { uuid: string } }) {
  const record = await getRecord(params.uuid);
  if (!record) notFound();

  const { pet, consultations } = record;
  const age = pet.birthDate
    ? `${Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / 31536000000)} años`
    : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-xs text-gray-400 mb-2">🐾 VetSystem · Cartilla Digital</div>
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
            {SPECIES_EMOJI[pet.species] ?? '🐾'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{pet.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pet.breed ?? pet.species} · {pet.sex === 'female' ? 'Hembra' : 'Macho'}
            {age ? ` · ${age}` : ''}
          </p>
          <p className="text-gray-400 text-sm">Dueño: {pet.owner.firstName} {pet.owner.lastName}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
            <span>✓</span> Cartilla activa verificada
          </div>
        </div>

        {/* Consultations */}
        <div className="space-y-4">
          {consultations.length === 0 && (
            <div className="text-center text-gray-400 py-8">Sin consultas registradas</div>
          )}
          {consultations.map((c) => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold text-gray-900">{c.reason}</div>
                </div>
                <div className="text-gray-400 text-xs flex-shrink-0 ml-4">
                  {new Date(c.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>

              {c.note && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Nota</div>
                  <p className="text-gray-700 text-sm leading-relaxed">{c.note.content}</p>
                </div>
              )}

              {c.prescriptions.map((rx, i) => (
                <div key={i} className="bg-emerald-50 rounded-lg p-3 mb-2">
                  <div className="text-xs font-semibold text-emerald-700 mb-1">💊 {rx.diagnosis}</div>
                  <p className="text-gray-700 text-xs">{rx.medications}</p>
                </div>
              ))}

              {c.vaccinations.map((v, i) => (
                <div key={i} className="bg-amber-50 rounded-lg p-3 mb-2">
                  <div className="text-xs font-semibold text-amber-700">💉 {v.vaccineName}</div>
                  {v.batch && <p className="text-gray-500 text-xs">Lote: {v.batch}</p>}
                  {v.nextDose && <p className="text-gray-500 text-xs">Próxima dosis: {new Date(v.nextDose).toLocaleDateString('es-MX')}</p>}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-xs">Cartilla de solo lectura · VetSystem</p>
          <p className="text-gray-400 text-xs mt-1">
            ¿Eres veterinario?{' '}
            <a href="/login" className="text-indigo-600 hover:underline">Inicia sesión</a> para agregar una consulta
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verificar vista pública en el navegador**

Obtener el publicUuid de Luna:
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@canes.com","password":"Doctor1234!"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

curl -s http://localhost:3001/pets/seed-luna-pet-id-00000000000000000001 \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print('http://localhost:3000/public/' + d['record']['id'])" 2>/dev/null || \
curl -s http://localhost:3001/pets/seed-luna-pet-id-00000000000000000001 \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | grep publicUuid
```

Abrir la URL en el navegador. Verificar:
- No requiere login
- Muestra nombre, especie, dueño
- Lista las 2 consultations con nota, receta y vacuna
- Fondo blanco/gris claro

- [ ] **Step 5: Commit final**

```bash
cd /home/gabriel/Documentos/vetSystem
git add apps/web/src/components/qr/ apps/web/src/components/medical-records/qr-modal.tsx apps/web/src/app/public/
git commit -m "feat: add QR scanner, QR modal and public cartilla page — MVP complete"
```

---

## Self-Review

### Spec coverage check

| Requisito del spec | Tarea |
|---|---|
| Monorepo npm workspaces | Task 1 |
| shared-types con DTOs y enums | Task 1 |
| docker-compose PostgreSQL + Redis | Task 2 |
| Prisma schema completo | Task 2 |
| Seed con clínicas, usuarios, mascotas, consultations | Task 3 |
| PrismaService, AppModule, main.ts con Helmet + CORS | Task 4 |
| Decoradores @Public, @Roles, @CurrentUser | Task 4 |
| Guards JwtAuthGuard + RolesGuard | Task 4 |
| TenantInterceptor | Task 4 |
| Auth: POST /auth/login (1 o N clínicas) | Task 5 |
| Auth: POST /auth/select-clinic | Task 5 |
| Auth: POST /auth/refresh + /auth/logout con Redis blacklist | Task 5 |
| Rate limiting en /auth/login | Task 5 |
| isActive en User | Task 2 (schema) |
| Next.js App Router + Tailwind | Task 6 |
| Zustand auth store + persistencia | Task 6 |
| Login form: email + password | Task 6 |
| Selector de clínica (paso 2 si N clínicas) | Task 6 |
| Dashboard con bienvenida | Task 6 |
| Pets CRUD + auto-create MedicalRecord | Task 7 |
| OWNER solo ve sus mascotas | Task 7 |
| Solo ADMIN puede borrar mascotas | Task 7 |
| PetCard + PetForm + lista con búsqueda | Task 8 |
| Consultations agrupando nota + recetas + vacunas | Task 9 |
| POST /medical-records/:id/consultations | Task 9 |
| POST /consultations/:id/note (409 si ya existe) | Task 9 |
| PATCH /consultations/notes/:id (autor o ADMIN) | Task 9 |
| DELETE /consultations/notes/:id (solo ADMIN) | Task 9 |
| POST /consultations/:id/prescriptions | Task 9 |
| POST /consultations/:id/vaccinations | Task 9 |
| Búsqueda ILIKE en notas, recetas, vacunas con ?q= y fechas | Task 9 |
| ConsultationTimeline con acordeones | Task 10 |
| MedicalRecordTabs con búsqueda global | Task 10 |
| NewConsultationForm | Task 10 |
| GET /public/:uuid sin autenticación | Task 11 |
| POST /medical-records/:id/qr (generación QR) | Task 11 |
| Vista pública /public/[uuid] sin navbar, fondo claro | Task 12 |
| QRScanner con @zxing/browser o UUID manual | Task 12 |
| QRModal con opción copiar enlace | Task 12 |

**Todos los requisitos del spec cubiertos.**

### Consistencia de tipos

- `JwtPayload.sub` → usado como `userId` en todos los servicios ✓
- `Role` enum de `@vet/shared-types` → importado en guards y servicios ✓
- `ConsultationSummary` → incluye `note`, `prescriptions`, `vaccinations` ✓
- `PetSummary` → incluye `owner` con `firstName`, `lastName`, `email` ✓
- `apiFetch<T>` → genérico, usado con tipos explícitos en todos los componentes ✓

---

Plan completo y guardado en `docs/superpowers/plans/2026-05-06-vetSystem-subproject1.md`.

**Dos opciones de ejecución:**

**1. Subagent-Driven (recomendado)** — Despachará un subagente fresco por tarea, revisará entre tareas, iteración rápida

**2. Inline Execution** — Ejecuta las tareas en esta sesión usando executing-plans, con checkpoints de revisión

¿Cuál prefieres?
