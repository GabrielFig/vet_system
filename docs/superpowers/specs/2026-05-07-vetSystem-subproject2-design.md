# VetSystem — Sub-proyecto 2: Citas, Inventario y Reportes PDF

**Fecha:** 2026-05-07
**Alcance:** Módulo de Citas con slots configurables · Inventario con control de stock · Reportes PDF (cartilla + reporte mensual)
**Entorno objetivo:** Local (docker-compose), misma base que Sub-proyecto 1
**Stack:** Next.js 14 + NestJS + Prisma + PostgreSQL (sin cambios de infraestructura)

---

## 1. Alcance

### Incluido
- **Citas:** agenda de la clínica con días/horas laborables y duración de slot configurable; citas con estado; endpoint de slots disponibles
- **Inventario:** productos por clínica, movimientos de stock (IN/OUT/ADJUSTMENT), alerta de stock bajo
- **Reportes PDF:** cartilla médica en PDF (descarga por mascota) y reporte mensual de clínica (consultas + inventario)

### Fuera de alcance
- Notificaciones push/email/SMS de recordatorio de cita
- Pagos (Stripe / Conekta)
- App móvil
- Deploy en producción

---

## 2. Módulo de Citas

### Modelo de datos

```prisma
enum AppointmentStatus {
  PENDING
  CONFIRMED
  CANCELLED
  DONE
}

model ClinicSchedule {
  id            String   @id @default(uuid())
  clinicId      String   @unique
  workDays      Int[]    // 0=domingo … 6=sábado
  startTime     String   // "09:00"
  endTime       String   // "18:00"
  slotMinutes   Int      @default(30)
  updatedAt     DateTime @updatedAt
}

model ScheduleException {
  id        String   @id @default(uuid())
  clinicId  String
  date      DateTime // día completo cerrado o con horario especial
  isClosed  Boolean  @default(true)
  startTime String?  // sobrescribe startTime si no es isClosed
  endTime   String?
  reason    String?
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
```

### API

| Método | Endpoint | Rol mínimo | Descripción |
|--------|----------|-----------|-------------|
| GET | `/clinics/:id/schedule` | DOCTOR | Obtiene configuración de horario |
| PUT | `/clinics/:id/schedule` | ADMIN | Actualiza horario y duración de slot |
| POST | `/clinics/:id/schedule/exceptions` | ADMIN | Agrega excepción (feriado, cierre) |
| DELETE | `/clinics/:id/schedule/exceptions/:exId` | ADMIN | Elimina excepción |
| GET | `/appointments/available-slots` | DOCTOR | `?clinicId=&date=&doctorId=` — devuelve slots libres del día |
| GET | `/appointments` | DOCTOR | Lista citas filtradas por `?date=&doctorId=&status=` |
| POST | `/appointments` | DOCTOR | Crea cita (valida que el slot esté libre) |
| PATCH | `/appointments/:id` | DOCTOR | Actualiza reason/notes/doctorId |
| PATCH | `/appointments/:id/status` | DOCTOR | Cambia status (CONFIRMED/CANCELLED/DONE) |

**Lógica de slots disponibles:**
1. Leer `ClinicSchedule` de la clínica
2. Verificar que el día pedido esté en `workDays` y no haya una `ScheduleException` con `isClosed=true`
3. Generar todos los slots del día (`startTime` → `endTime` en intervalos de `slotMinutes`)
4. Consultar `Appointment` donde `clinicId=X AND startsAt >= inicio del día AND startsAt < fin del día AND status != CANCELLED`
5. Devolver slots que no colisionen con citas existentes

### Frontend

- **`/appointments`** — vista de la semana actual con lista de citas del día seleccionado, ordenadas por hora
- Modal **Nueva cita**: selector de mascota (búsqueda), selector de doctor, date picker, slot picker (consume `/available-slots`), motivo
- Badges de status coloreados (PENDING=amarillo, CONFIRMED=verde, CANCELLED=rojo, DONE=gris)
- ADMIN puede cambiar cualquier status; DOCTOR solo puede marcar DONE o CANCELLED las suyas

---

## 3. Módulo de Inventario

### Modelo de datos

```prisma
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
  unit         String          // "piezas", "ml", "kg", etc.
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
  quantity  Int          // positivo siempre; el tipo determina si suma o resta
  notes     String?
  createdAt DateTime     @default(now())
  product   Product      @relation(fields: [productId], references: [id])
  user      User         @relation("StockMovementUser", fields: [userId], references: [id])

  @@index([productId])
  @@index([clinicId])
}
```

**Invariante de stock:** la creación de un `StockMovement` y la actualización de `Product.currentStock` ocurren siempre en la misma `$transaction`. IN suma, OUT resta, ADJUSTMENT setea el stock al valor dado (útil para conteo físico).

### API

| Método | Endpoint | Rol mínimo | Descripción |
|--------|----------|-----------|-------------|
| GET | `/products` | DOCTOR | Lista productos activos de la clínica |
| POST | `/products` | ADMIN | Crea producto |
| PATCH | `/products/:id` | ADMIN | Actualiza datos (no stock) |
| DELETE | `/products/:id` | ADMIN | Soft-delete (`isActive=false`) |
| GET | `/products/:id/movements` | DOCTOR | Historial de movimientos del producto |
| POST | `/products/:id/movements` | DOCTOR | Registra movimiento (IN/OUT/ADJUSTMENT) |
| GET | `/inventory/low-stock` | DOCTOR | Productos con `currentStock <= minStock` |

### Frontend

- **`/inventory`** — tabla de productos con columnas: nombre, SKU, categoría, stock actual (badge rojo si ≤ minStock), precio
- Botón "Nuevo producto" (ADMIN) y botón "+ Movimiento" por fila
- Modal de movimiento: tipo (IN/OUT/ADJUSTMENT), cantidad, notas
- Badge de alerta en el Dashboard cuando hay productos en stock bajo

---

## 4. Módulo de Reportes PDF

### Librería

**`pdfmake`** en NestJS — declarativo, soporte nativo de tablas y listas, sin dependencias de browser headless. Se instala en `apps/api`.

### Endpoints

| Método | Endpoint | Rol mínimo | Descripción |
|--------|----------|-----------|-------------|
| GET | `/pets/:id/record/pdf` | DOCTOR | PDF de la cartilla médica completa |
| GET | `/reports/monthly` | ADMIN | `?month=5&year=2026` → PDF reporte mensual |

**Cartilla PDF** incluye:
- Encabezado: nombre, especie, raza, sexo, edad, dueño
- Sección por cada consulta: fecha, motivo, nota médica, recetas, vacunas
- Pie de página: "Generado por VetSystem el {fecha}"

**Reporte mensual** incluye:
- Resumen: total consultas, total pacientes atendidos
- Tabla: doctor → número de consultas del mes
- Tabla: productos con stock bajo al cierre del mes
- Tabla: movimientos de inventario del mes (entradas vs salidas por categoría)

Ambos endpoints responden con `Content-Disposition: attachment` y `Content-Type: application/pdf`.

### Frontend

- Botón **"Descargar PDF"** en `/pets/:id/record` → llama `GET /pets/:id/record/pdf` y abre el blob como descarga
- Página **`/reports`** en el dashboard: selector de mes/año, botón "Generar reporte", descarga el PDF mensual
- Acceso a `/reports` solo para ADMIN

---

## 5. Cambios al schema existente

Además de los modelos nuevos, se agrega la relación en `User` y `Pet`:

```prisma
// En User — agregar:
appointments        Appointment[]   @relation("AppointmentDoctor")
stockMovements      StockMovement[] @relation("StockMovementUser")

// En Pet — agregar:
appointments        Appointment[]
```

Una sola migración cubre todos los modelos nuevos.

---

## 6. Orden de implementación

1. Migración Prisma (todos los modelos nuevos en una sola migración)
2. Módulo Citas — backend (ClinicSchedule + slots + Appointment CRUD)
3. Módulo Citas — frontend
4. Módulo Inventario — backend
5. Módulo Inventario — frontend + badge en dashboard
6. Módulo Reportes — backend (pdfmake, ambos endpoints)
7. Módulo Reportes — frontend (botones de descarga)
