# VetSystem

Sistema de gestión para clínicas veterinarias. Monorepo fullstack con NestJS (API) y Next.js (frontend).

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Zustand |
| Backend | NestJS, Prisma ORM, JWT + Refresh Tokens, Redis |
| Base de datos | PostgreSQL 16 |
| Reportes | pdfmake (PDFs server-side) |
| Infraestructura local | Docker Compose |

## Módulos

- **Auth** — Login con soporte multi-clínica, refresh tokens, blacklist en Redis
- **Mascotas** — CRUD de pacientes con historial médico
- **Historial médico** — Consultas, notas, recetas y vacunas; búsqueda por texto y rango de fechas
- **Vista pública / QR** — URL pública con historial completo de la mascota (sin autenticación), código QR descargable
- **Citas** — Agenda semanal, slots configurables por clínica, manejo de excepciones (feriados/cierres)
- **Inventario** — Productos con control de stock, movimientos IN/OUT/AJUSTE en transacción atómica, alerta de stock bajo
- **Reportes PDF** — Cartilla médica por mascota y reporte mensual de clínica (consultas + inventario)

## Estructura

```
vetSystem/
├── apps/
│   ├── api/          # NestJS — puerto 3001
│   └── web/          # Next.js — puerto 3000
├── packages/
│   ├── shared-types/ # Tipos TypeScript compartidos
│   └── utils/        # Utilidades comunes (slug, paginación)
├── docker-compose.yml
└── package.json      # npm workspaces
```

## Requisitos

- Node.js 20+
- Docker y Docker Compose

## Configuración inicial

```bash
# 1. Clonar el repositorio
git clone git@github.com:GabrielFig/vet_system.git
cd vet_system

# 2. Instalar dependencias
npm install

# 3. Crear el archivo de variables de entorno
cp .env.example .env

# 4. Levantar la base de datos y Redis
docker-compose up -d

# 5. Ejecutar la migración
npm run db:migrate

# 6. Cargar datos de prueba
npm run db:seed
```

## Desarrollo

```bash
# API (NestJS en :3001)
npm run dev:api

# Frontend (Next.js en :3000)
npm run dev:web
```

## Variables de entorno (`.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Conexión a PostgreSQL | `postgresql://vetuser:vetpass@localhost:5432/vetdb` |
| `REDIS_URL` | Conexión a Redis | `redis://localhost:6379` |
| `JWT_SECRET` | Secreto para JWT (mín. 32 chars) | `dev_secret_change_in_production` |
| `JWT_EXPIRY` | Duración del access token | `15m` |
| `REFRESH_TOKEN_EXPIRY` | Duración del refresh token | `7d` |
| `API_PORT` | Puerto de la API | `3001` |
| `API_URL` | URL base de la API | `http://localhost:3001` |
| `WEB_URL` | URL del frontend | `http://localhost:3000` |

## Usuarios de prueba (seed)

| Email | Contraseña | Rol | Clínica |
|-------|-----------|-----|---------|
| admin@canes.com | Admin1234! | ADMIN | Canes Vet |
| doctor@canes.com | Doctor1234! | DOCTOR | Canes Vet |
| admin@mininos.com | Admin1234! | ADMIN | Mininos Vet |
| doctor@mininos.com | Doctor1234! | DOCTOR | Mininos Vet |
| owner@demo.com | Owner1234! | OWNER | Canes Vet |

## Scripts disponibles

```bash
npm run dev:api          # Inicia la API en modo desarrollo
npm run dev:web          # Inicia el frontend en modo desarrollo
npm run build            # Compila todos los workspaces
npm run test             # Ejecuta todos los tests
npm run db:migrate       # Ejecuta las migraciones de Prisma
npm run db:seed          # Carga los datos de prueba
npm run db:studio        # Abre Prisma Studio en el navegador
```

## API — Endpoints principales

### Auth
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/login` | Login con email y contraseña |
| POST | `/auth/select-clinic` | Selección de clínica (multi-clínica) |
| POST | `/auth/refresh` | Renovar access token |
| POST | `/auth/logout` | Cerrar sesión (blacklist del refresh token) |

### Mascotas y Historial
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/pets` | Lista de mascotas de la clínica |
| POST | `/pets` | Crear mascota |
| GET | `/pets/:id` | Detalle de mascota |
| GET | `/medical-records/:id` | Historial médico completo |
| POST | `/medical-records/:id/consultations` | Nueva consulta |
| POST | `/consultations/:id/note` | Agregar nota médica |
| POST | `/consultations/:id/prescriptions` | Agregar receta |
| POST | `/consultations/:id/vaccinations` | Agregar vacuna |
| GET | `/pets/:id/record/pdf` | Descargar cartilla médica en PDF |
| GET | `/public/:uuid` | Vista pública del historial (sin auth) |

### Citas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/appointments/available-slots?date=` | Slots disponibles del día |
| GET | `/appointments` | Lista de citas |
| POST | `/appointments` | Crear cita |
| PATCH | `/appointments/:id/status` | Cambiar estado de la cita |
| PUT | `/appointments/schedule` | Configurar horario de la clínica |

### Inventario
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/products` | Lista de productos |
| POST | `/products` | Crear producto |
| POST | `/products/:id/movements` | Registrar movimiento de stock (IN/OUT/AJUSTE) |
| GET | `/inventory/low-stock` | Productos con stock bajo |

### Reportes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/reports/monthly?month=&year=` | Reporte mensual en PDF (solo ADMIN) |
