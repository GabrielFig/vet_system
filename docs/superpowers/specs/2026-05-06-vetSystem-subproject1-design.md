# VetSystem — Sub-proyecto 1: MVP de demostración

**Fecha:** 2026-05-06
**Alcance:** Monorepo · Auth · Mascotas · Cartilla médica + Consultations · QR público
**Entorno objetivo:** Local (docker-compose)
**Stack:** Next.js 14 + NestJS + Prisma + PostgreSQL + Redis

---

## 1. Alcance del Sub-proyecto 1

Este sub-proyecto es el MVP mínimo necesario para demostrar el sistema a una veterinaria real como primer cliente potencial.

### Incluido
- Monorepo scaffold (npm workspaces)
- Autenticación: login email+contraseña, JWT, selector de clínica si el usuario pertenece a más de una
- Gestión de mascotas: CRUD, foto (almacenamiento local en el MVP)
- Cartilla médica con `Consultation` como entidad agrupadora de visitas
- Notas médicas, Recetas y Vacunas dentro de cada Consultation
- Búsqueda en historial por tab (ILIKE sobre campos relevantes)
- Generación de QR server-side + vista pública `/public/:uuid` sin autenticación
- Lector de QR con cámara (`@zxing/browser`) o UUID manual
- Roles: ADMIN, DOCTOR, OWNER con permisos diferenciados
- Seed de datos demo

### Diferido a Sub-proyecto 2+
- Módulo de Citas (Appointment + calendario)
- Inventario y modo offline
- Reportes PDF
- Pagos (Stripe / Conekta)
- Notificaciones push / email / SMS
- App móvil React Native
- Deploy en Railway / AWS

---

## 2. Arquitectura

### Estructura de monorepo

```
vetSystem/
├── apps/
│   ├── web/          # Next.js 14 (App Router) — frontend
│   └── api/          # NestJS — backend
├── packages/
│   ├── shared-types/ # DTOs, enums y tipos compartidos
│   ├── ui/           # Design tokens base (shadcn/ui)
│   └── utils/        # Helpers comunes
├── docker-compose.yml
├── .env.example
└── README.md
```

### Capas del sistema

| Capa | Tecnología | Responsabilidad |
|---|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind + shadcn/ui | UI, rutas, contexto de auth |
| Backend | NestJS + TypeScript | API REST, guards, validación |
| ORM | Prisma | Queries tipadas, migraciones |
| Base de datos | PostgreSQL 16 | Persistencia |
| Caché / sesiones | Redis 7 | Blacklist de refresh tokens, rate limiting |
| Almacenamiento | Sistema de archivos local | Fotos de mascotas (MVP) |

### Multi-tenancy

El aislamiento por tenant se implementa a nivel de aplicación:

- Cada request autenticado lleva `clinicId` en el payload del JWT
- Un `TenantInterceptor` global extrae el `clinicId` y lo inyecta en el contexto de ejecución
- Todos los servicios de entidades de tenant filtran automáticamente por `clinicId`
- **Entidades globales** (Pet, MedicalRecord, User): no filtran por `clinicId`
- **Entidades mixtas** (Consultation): son hijos de un MedicalRecord global pero llevan `clinicId` para registrar qué clínica realizó la visita. Son accesibles desde cualquier clínica vía la cartilla pública, pero quedan estampadas con su origen.
- **Entidades de tenant** (MedicalNote, Prescription, Vaccination, ClinicUser): siempre incluyen `clinicId`

---

## 3. Modelo de datos (Prisma Schema)

### Entidades globales

```prisma
model User {
  id           String      @id @default(uuid())
  email        String      @unique
  passwordHash String
  firstName    String
  lastName     String
  phone        String?
  avatarUrl    String?
  isActive     Boolean     @default(true)
  createdAt    DateTime    @default(now())
  clinics      ClinicUser[]
  pets         Pet[]
}

model Pet {
  id        String    @id @default(uuid())
  ownerId   String
  name      String
  species   String    // 'dog'|'cat'|'bird'|'rabbit'|'other'
  breed     String?
  birthDate DateTime?
  sex       String    // 'male'|'female'
  photoUrl  String?
  createdAt DateTime  @default(now())
  owner     User      @relation(fields: [ownerId], references: [id])
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
  id           String        @id @default(uuid())
  recordId     String
  clinicId     String
  doctorId     String
  reason       String
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  record       MedicalRecord @relation(fields: [recordId], references: [id])
  note         MedicalNote?
  prescriptions Prescription[]
  vaccinations  Vaccination[]
}
```

### Entidades de tenant

```prisma
model Clinic {
  id          String       @id @default(uuid())
  name        String
  slug        String       @unique
  licenseKey  String       @unique
  planType    PlanType     @default(BASIC)
  logoUrl     String?
  isActive    Boolean      @default(true)
  createdAt   DateTime     @default(now())
  users       ClinicUser[]
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

enum Role     { ADMIN DOCTOR OWNER }
enum PlanType { BASIC PRO ENTERPRISE }
```

### Relaciones clave

```
User 1→N Pet
Pet 1→1 MedicalRecord
MedicalRecord 1→N Consultation
Consultation 1→1 MedicalNote (opcional)
Consultation 1→N Prescription
Consultation 1→N Vaccination
Clinic 1→N ClinicUser ←→ User
```

---

## 4. Módulos NestJS

| Módulo | Responsabilidades |
|---|---|
| `AuthModule` | Login, refresh, logout, select-clinic, guard JWT, guard de roles |
| `PetsModule` | CRUD de mascotas, búsqueda, upload de foto |
| `MedicalRecordsModule` | CRUD de Consultations, Notes, Prescriptions, Vaccinations, búsqueda |
| `PublicModule` | GET `/public/:uuid` sin autenticación |

### Guards y decoradores

- `JwtAuthGuard` — aplicado globalmente; `PublicModule` usa `@Public()` para saltarlo
- `RolesGuard` — aplicado por endpoint con `@Roles(Role.ADMIN, Role.DOCTOR)`
- `TenantInterceptor` — extrae `clinicId` del JWT y lo inyecta en `ExecutionContext`

---

## 5. Endpoints de la API

### Auth
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/auth/login` | Email + contraseña; retorna JWT o lista de clínicas | No |
| POST | `/auth/select-clinic` | Elige clínica cuando hay más de una; retorna JWT definitivo | No |
| POST | `/auth/refresh` | Renueva access token | No |
| POST | `/auth/logout` | Invalida refresh token en Redis | JWT |
| GET | `/auth/me` | Perfil del usuario autenticado | JWT |

### Mascotas
| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| GET | `/pets` | ADMIN, DOCTOR, OWNER | Lista (OWNER solo sus mascotas) |
| POST | `/pets` | ADMIN, DOCTOR, OWNER | Crear mascota |
| GET | `/pets/:id` | ADMIN, DOCTOR, OWNER | Detalle de mascota (sin cartilla; la cartilla se carga desde `/medical-records`) |
| PATCH | `/pets/:id` | ADMIN, DOCTOR | Actualizar datos |
| DELETE | `/pets/:id` | ADMIN | Eliminar mascota |

### Cartilla médica
| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| GET | `/medical-records/:id` | ADMIN, DOCTOR, OWNER | Cartilla completa con consultations |
| POST | `/medical-records/:id/consultations` | ADMIN, DOCTOR | Crear consultation (agrupa visita) |
| GET | `/medical-records/:id/consultations` | ADMIN, DOCTOR, OWNER | Listar consultations (paginado) |
| POST | `/consultations/:id/note` | ADMIN, DOCTOR | Crear nota de la consulta. Retorna `409` si ya existe una nota (usar `PATCH` para editar) |
| PATCH | `/consultations/notes/:noteId` | Autor o ADMIN | Editar nota |
| DELETE | `/consultations/notes/:noteId` | Solo ADMIN | Borrar nota |
| POST | `/consultations/:id/prescriptions` | ADMIN, DOCTOR | Agregar receta |
| POST | `/consultations/:id/vaccinations` | ADMIN, DOCTOR | Registrar vacuna |
| GET | `/medical-records/:id/notes` | ADMIN, DOCTOR, OWNER | Búsqueda global (?q=, ?from=, ?to=) |
| GET | `/medical-records/:id/prescriptions` | ADMIN, DOCTOR, OWNER | Búsqueda global (?q=) |
| GET | `/medical-records/:id/vaccinations` | ADMIN, DOCTOR, OWNER | Búsqueda global (?q=) |

### QR y vista pública
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/public/:uuid` | No | Cartilla pública solo lectura |
| POST | `/medical-records/:id/qr` | ADMIN | Regenerar / generar QR |
| PATCH | `/medical-records/:id/visibility` | ADMIN, OWNER | Cambiar isPublic |

---

## 6. Flujo de Login

```
POST /auth/login { email, password }
  └─ 1 clínica → JWT con clinicId → /dashboard
  └─ N clínicas → { requiresClinicSelection: true, clinics: [...] }
       └─ POST /auth/select-clinic { clinicId } → JWT definitivo → /dashboard
```

El JWT contiene: `{ sub: userId, clinicId, role, email, iat, exp }`.
- Access token: 15 minutos
- Refresh token: 7 días, almacenado en Redis con TTL; se invalida al hacer logout

---

## 7. Reglas de negocio

1. Solo `ADMIN` puede **borrar** notas médicas. El doctor puede editar solo las suyas.
2. El `OWNER` solo tiene acceso de **lectura** a cartilla, notas, recetas y vacunas de sus mascotas.
3. El endpoint `/public/:uuid` no requiere autenticación y devuelve la cartilla completa en modo solo lectura.
4. El QR de una cartilla es permanente (`publicUuid` nunca cambia). Solo `isPublic` puede togglarse.
5. Un doctor puede crear Consultations sobre mascotas de **cualquier clínica** (la cartilla es global), pero la Consultation y sus hijos llevan el `clinicId` del doctor.
6. Los tokens expirados retornan `401` con mensaje `TOKEN_EXPIRED` para que el cliente haga refresh automático.
7. Rate limiting: 100 req/min por IP global; `/auth/login` limitado a 10 intentos/min por IP (bloqueo temporal en Redis).

---

## 8. Vistas del frontend (Next.js App Router)

| Ruta | Vista | Roles |
|---|---|---|
| `/login` | Email + contraseña; selector de clínica si aplica | Público |
| `/dashboard` | Bienvenida, accesos rápidos, últimas consultations | ADMIN, DOCTOR |
| `/pets` | Lista de mascotas con buscador | ADMIN, DOCTOR, OWNER |
| `/pets/[id]` | Detalle de mascota + botón "Ver cartilla" | ADMIN, DOCTOR, OWNER |
| `/pets/[id]/record` | Cartilla médica: timeline de Consultations + tabs de búsqueda global | ADMIN, DOCTOR, OWNER |
| `/public/[uuid]` | Cartilla pública sin navbar, fondo claro, apta para imprimir | Público |

### Componentes clave

- `AuthProvider` — Zustand store: `user`, `clinic`, `role`, `accessToken`
- `PetCard` — card con foto, nombre, especie, dueño
- `ConsultationTimeline` — lista de Consultations ordenadas por fecha, con badges de nota/recetas/vacunas
- `ConsultationDetail` — acordeón con nota, recetas y vacunas de una sola visita
- `MedicalRecordTabs` — tabs Notas / Recetas / Vacunas como filtros globales con búsqueda
- `QRScanner` — modal con cámara `@zxing/browser` + input UUID manual
- `QRModal` — muestra el QR generado con opción de copiar enlace

---

## 9. Búsqueda en historial

Cada tab realiza su propia búsqueda sobre la tabla correspondiente:

| Tab | Tabla | Campos buscados | Filtro de fecha sobre |
|---|---|---|---|
| Notas | `MedicalNote` | `title ILIKE`, `content ILIKE` | `createdAt` |
| Recetas | `Prescription` | `diagnosis ILIKE`, `medications ILIKE` | `createdAt` |
| Vacunas | `Vaccination` | `vaccineName ILIKE`, `batch ILIKE` | `appliedAt` |

Query params soportados en los 3 tabs: `?q=término&from=ISO8601&to=ISO8601`

Estrategia: `ILIKE` para el MVP. Migración a `tsvector` + índice GIN disponible como mejora futura sin cambios en la API.

---

## 10. Infraestructura local

### docker-compose.yml (servicios)

| Servicio | Imagen | Puerto |
|---|---|---|
| `api` | NestJS (build local) | 3001 |
| `web` | Next.js (build local) | 3000 |
| `postgres` | postgres:16-alpine | 5432 |
| `redis` | redis:7-alpine | 6379 |

### Variables de entorno requeridas (.env.example)

```env
# Base de datos
DATABASE_URL=postgresql://vetuser:vetpass@postgres:5432/vetdb

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=changeme_in_production
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# App
API_PORT=3001
WEB_URL=http://localhost:3000
API_URL=http://localhost:3001

# Almacenamiento local (MVP)
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE_MB=10
```

---

## 11. Seguridad

- `Helmet.js` para headers HTTP seguros
- CORS con whitelist: `http://localhost:3000`
- Contraseñas hasheadas con `bcrypt` (saltRounds: 12)
- Rate limiting con `@nestjs/throttler` + Redis como store
- Validación de todos los inputs con `class-validator`
- Prevención de IDOR: todo query de entidad de tenant incluye `clinicId` del JWT
- Archivos subidos: validación de tipo MIME + tamaño máximo 10MB

---

## 12. Seed de datos demo

El seed crea:
- 2 clínicas: "Canes Vet" (slug: `canes`) y "Mininos Vet" (slug: `mininos`)
- 1 ADMIN y 1 DOCTOR por clínica
- 1 OWNER con 2 mascotas
- 1 MedicalRecord por mascota con 2 Consultations de clínicas distintas
- Cada Consultation con nota, 1 receta y 1 vacuna

---

## 13. Orden de implementación (Vertical Slices)

1. **Monorepo scaffold** — carpetas, workspaces, tsconfig, docker-compose, .env.example
2. **Prisma schema + migraciones + seed**
3. **Auth slice** — backend (login, refresh, logout, guards) + frontend (login, AuthProvider, rutas protegidas)
4. **Pets slice** — backend (CRUD + upload local) + frontend (lista, detalle)
5. **Medical record + Consultation slice** — backend (CRUD + búsqueda) + frontend (timeline, detalle, formularios)
6. **QR slice** — backend (generación qrcode) + frontend (QRScanner modal, vista /public/:uuid)

---

## 14. Fuera de alcance (Sub-proyectos futuros)

| Feature | Sub-proyecto |
|---|---|
| Citas y calendario | 2 |
| Inventario + modo offline (PWA/IndexedDB) | 3 |
| Reportes PDF | 3 |
| Pagos Stripe / Conekta | 4 |
| Notificaciones FCM / Resend / Twilio | 4 |
| App móvil React Native + Expo | 5 |
| Deploy Railway / AWS ECS | 6 |
