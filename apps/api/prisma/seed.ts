import { PrismaClient, Role, PlanType, PetSex, ClinicModuleType, MovementType, AppointmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PLAN_MODULES: Record<PlanType, ClinicModuleType[]> = {
  BASIC: [],
  PRO: [ClinicModuleType.INVENTORY, ClinicModuleType.REPORTS],
  ENTERPRISE: [ClinicModuleType.INVENTORY, ClinicModuleType.REPORTS],
};

async function upsertClinicWithModules(data: { slug: string; name: string; licenseKey: string; planType: PlanType }) {
  const clinic = await prisma.clinic.upsert({
    where: { slug: data.slug },
    update: {},
    create: { name: data.name, slug: data.slug, licenseKey: data.licenseKey, planType: data.planType },
  });
  // Ensure modules match the plan (idempotent)
  for (const mod of PLAN_MODULES[data.planType]) {
    await prisma.clinicModule.upsert({
      where: { clinicId_module: { clinicId: clinic.id, module: mod } },
      create: { clinicId: clinic.id, module: mod },
      update: {},
    });
  }
  return clinic;
}

async function main() {
  console.log('🌱 Seeding database...');

  const hash = (pw: string) => bcrypt.hash(pw, 12);

  // ── Super Admin ───────────────────────────────────────────────────────────

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@vetsystem.com' },
    update: { isSuperAdmin: true },
    create: {
      email: 'superadmin@vetsystem.com',
      passwordHash: await hash('SuperAdmin1234!'),
      firstName: 'Super',
      lastName: 'Admin',
      isSuperAdmin: true,
    },
  });

  // ── Clinics ───────────────────────────────────────────────────────────────

  const basicClinic = await upsertClinicWithModules({
    slug: 'petcare-basico',
    name: 'PetCare Básico',
    licenseKey: 'BASIC-2026-LICENSE',
    planType: PlanType.BASIC,
  });

  const proClinic = await upsertClinicWithModules({
    slug: 'canes',
    name: 'Canes Vet',
    licenseKey: 'CANES-2026-LICENSE',
    planType: PlanType.PRO,
  });

  const enterpriseClinic = await upsertClinicWithModules({
    slug: 'elite-animal',
    name: 'Elite Animal Hospital',
    licenseKey: 'ELITE-2026-LICENSE',
    planType: PlanType.ENTERPRISE,
  });

  // ── Users ─────────────────────────────────────────────────────────────────

  // Super admin también pertenece a Canes para poder usar el sistema
  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: proClinic.id, userId: superAdmin.id } },
    update: {},
    create: { clinicId: proClinic.id, userId: superAdmin.id, role: Role.ADMIN },
  });

  // BASIC
  for (const [email, firstName, lastName, role] of [
    ['admin@basic.com', 'María', 'Torres', Role.ADMIN],
    ['doctor@basic.com', 'Luis', 'Ramírez', Role.DOCTOR],
  ] as const) {
    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash: await hash(role === Role.ADMIN ? 'Admin1234!' : 'Doctor1234!'), firstName, lastName },
    });
    await prisma.clinicUser.upsert({
      where: { clinicId_userId: { clinicId: basicClinic.id, userId: u.id } },
      update: {},
      create: { clinicId: basicClinic.id, userId: u.id, role },
    });
  }

  // PRO
  const proAdmin = await prisma.user.upsert({
    where: { email: 'admin@canes.com' },
    update: {},
    create: { email: 'admin@canes.com', passwordHash: await hash('Admin1234!'), firstName: 'Carlos', lastName: 'Mendoza' },
  });
  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: proClinic.id, userId: proAdmin.id } },
    update: {},
    create: { clinicId: proClinic.id, userId: proAdmin.id, role: Role.ADMIN },
  });

  const proDoctor = await prisma.user.upsert({
    where: { email: 'doctor@canes.com' },
    update: {},
    create: { email: 'doctor@canes.com', passwordHash: await hash('Doctor1234!'), firstName: 'Roberto', lastName: 'García' },
  });
  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: proClinic.id, userId: proDoctor.id } },
    update: {},
    create: { clinicId: proClinic.id, userId: proDoctor.id, role: Role.DOCTOR },
  });

  // ENTERPRISE
  for (const [email, firstName, lastName, role] of [
    ['admin@elite.com', 'Valentina', 'Herrera', Role.ADMIN],
    ['doctor@elite.com', 'Andrés', 'Morales', Role.DOCTOR],
  ] as const) {
    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash: await hash(role === Role.ADMIN ? 'Admin1234!' : 'Doctor1234!'), firstName, lastName },
    });
    await prisma.clinicUser.upsert({
      where: { clinicId_userId: { clinicId: enterpriseClinic.id, userId: u.id } },
      update: {},
      create: { clinicId: enterpriseClinic.id, userId: u.id, role },
    });
  }

  // ── Clients & Pets ────────────────────────────────────────────────────────

  const anaClient = await prisma.client.upsert({
    where: { id: 'seed-client-ana-rodriguez-000000001' },
    update: {},
    create: {
      id: 'seed-client-ana-rodriguez-000000001',
      clinicId: proClinic.id,
      firstName: 'Ana',
      lastName: 'Rodríguez',
      phone: '+52 55 1234 5678',
      email: 'ana.rodriguez@email.com',
    },
  });

  const luna = await prisma.pet.upsert({
    where: { id: 'seed-luna-pet-id-00000000000000000001' },
    update: {},
    create: {
      id: 'seed-luna-pet-id-00000000000000000001',
      clientId: anaClient.id,
      name: 'Luna',
      species: 'dog',
      breed: 'Labrador',
      sex: PetSex.FEMALE,
      birthDate: new Date('2023-03-15'),
    },
  });

  const lunaRecord = await prisma.medicalRecord.upsert({
    where: { petId: luna.id },
    update: {},
    create: { petId: luna.id },
  });

  const lunaConsult1 = await prisma.consultation.upsert({
    where: { id: 'seed-luna-consult1-000000000000000001' },
    update: {},
    create: {
      id: 'seed-luna-consult1-000000000000000001',
      recordId: lunaRecord.id,
      clinicId: proClinic.id,
      doctorId: proDoctor.id,
      reason: 'Revisión general',
      createdAt: new Date('2026-05-05'),
    },
  });

  await prisma.medicalNote.upsert({
    where: { consultationId: lunaConsult1.id },
    update: {},
    create: {
      consultationId: lunaConsult1.id,
      clinicId: proClinic.id,
      authorId: proDoctor.id,
      title: 'Revisión general',
      content: 'Paciente en buen estado general. Peso 28kg. Sin alteraciones en auscultación cardiopulmonar. Mucosas rosadas. Temperatura normal.',
    },
  });

  await prisma.prescription.upsert({
    where: { id: 'seed-luna-presc1-0000000000000000001' },
    update: {},
    create: {
      id: 'seed-luna-presc1-0000000000000000001',
      consultationId: lunaConsult1.id,
      clinicId: proClinic.id,
      doctorId: proDoctor.id,
      diagnosis: 'Paciente sano en revisión preventiva',
      medications: 'Vitamina E 400mg — 1 cápsula diaria por 30 días',
      instructions: 'Administrar con comida. Guardar en lugar fresco y seco.',
      validUntil: new Date('2026-06-05'),
    },
  });

  await prisma.vaccination.upsert({
    where: { id: 'seed-luna-vacc1-00000000000000000001' },
    update: {},
    create: {
      id: 'seed-luna-vacc1-00000000000000000001',
      consultationId: lunaConsult1.id,
      clinicId: proClinic.id,
      appliedById: proDoctor.id,
      vaccineName: 'Antirrábica',
      batch: 'RABV-2026-001',
      appliedAt: new Date('2026-05-05'),
      nextDose: new Date('2027-05-05'),
    },
  });

  const michi = await prisma.pet.upsert({
    where: { id: 'seed-michi-pet-id-00000000000000000002' },
    update: {},
    create: {
      id: 'seed-michi-pet-id-00000000000000000002',
      clientId: anaClient.id,
      name: 'Michi',
      species: 'cat',
      breed: 'Siamés',
      sex: PetSex.MALE,
      birthDate: new Date('2022-07-20'),
    },
  });

  await prisma.medicalRecord.upsert({
    where: { petId: michi.id },
    update: {},
    create: { petId: michi.id },
  });

  // ── Clientes adicionales (Canes Vet) ─────────────────────────────────────

  const carlosClient = await prisma.client.upsert({
    where: { id: 'seed-client-carlos-lopez-000000002' },
    update: {},
    create: {
      id: 'seed-client-carlos-lopez-000000002',
      clinicId: proClinic.id,
      firstName: 'Carlos',
      lastName: 'López',
      phone: '+52 55 9876 5432',
      email: 'carlos.lopez@email.com',
    },
  });

  const sofiaClient = await prisma.client.upsert({
    where: { id: 'seed-client-sofia-martinez-000000003' },
    update: {},
    create: {
      id: 'seed-client-sofia-martinez-000000003',
      clinicId: proClinic.id,
      firstName: 'Sofía',
      lastName: 'Martínez',
      phone: '+52 55 5555 1111',
      email: 'sofia.martinez@email.com',
    },
  });

  // ── Mascotas adicionales ──────────────────────────────────────────────────

  const max = await prisma.pet.upsert({
    where: { id: 'seed-max-pet-id-000000000000000000003' },
    update: {},
    create: {
      id: 'seed-max-pet-id-000000000000000000003',
      clientId: carlosClient.id,
      name: 'Max',
      species: 'dog',
      breed: 'Pastor Alemán',
      sex: PetSex.MALE,
      birthDate: new Date('2021-06-10'),
    },
  });
  await prisma.medicalRecord.upsert({ where: { petId: max.id }, update: {}, create: { petId: max.id } });

  const whiskers = await prisma.pet.upsert({
    where: { id: 'seed-whiskers-pet-id-0000000000000000004' },
    update: {},
    create: {
      id: 'seed-whiskers-pet-id-0000000000000000004',
      clientId: carlosClient.id,
      name: 'Whiskers',
      species: 'cat',
      breed: 'Persa',
      sex: PetSex.FEMALE,
      birthDate: new Date('2020-11-05'),
    },
  });
  await prisma.medicalRecord.upsert({ where: { petId: whiskers.id }, update: {}, create: { petId: whiskers.id } });

  const buddy = await prisma.pet.upsert({
    where: { id: 'seed-buddy-pet-id-000000000000000000005' },
    update: {},
    create: {
      id: 'seed-buddy-pet-id-000000000000000000005',
      clientId: sofiaClient.id,
      name: 'Buddy',
      species: 'dog',
      breed: 'Golden Retriever',
      sex: PetSex.MALE,
      birthDate: new Date('2022-01-20'),
    },
  });
  await prisma.medicalRecord.upsert({ where: { petId: buddy.id }, update: {}, create: { petId: buddy.id } });

  // ── Horario de la clínica ─────────────────────────────────────────────────

  await prisma.clinicSchedule.upsert({
    where: { clinicId: proClinic.id },
    update: {},
    create: {
      clinicId: proClinic.id,
      workDays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '18:00',
      slotMinutes: 30,
    },
  });

  // ── Inventario ────────────────────────────────────────────────────────────

  const productDefs = [
    { id: 'seed-prod-001', name: 'Vacuna Antirrábica Nobivac',   sku: 'VAC-001', category: 'Vacunas',      unit: 'dosis',   stock: 45, min: 10, cost: 120,  sale: 250  },
    { id: 'seed-prod-002', name: 'Vacuna Parvovirus DA2PPv',     sku: 'VAC-002', category: 'Vacunas',      unit: 'dosis',   stock: 28, min: 8,  cost: 180,  sale: 350  },
    { id: 'seed-prod-003', name: 'Amoxicilina 500mg',            sku: 'MED-001', category: 'Medicamentos', unit: 'tableta', stock: 150,min: 30, cost: 5,    sale: 15   },
    { id: 'seed-prod-004', name: 'Meloxicam 1mg/ml',             sku: 'MED-002', category: 'Medicamentos', unit: 'ml',      stock: 80, min: 20, cost: 8,    sale: 25   },
    { id: 'seed-prod-005', name: 'Metronidazol 250mg',           sku: 'MED-003', category: 'Medicamentos', unit: 'tableta', stock: 95, min: 25, cost: 4,    sale: 12   },
    { id: 'seed-prod-006', name: 'Guantes de látex caja x100',   sku: 'MAT-001', category: 'Materiales',   unit: 'caja',    stock: 12, min: 5,  cost: 85,   sale: 150  },
    { id: 'seed-prod-007', name: 'Jeringas 5ml caja x100',       sku: 'MAT-002', category: 'Materiales',   unit: 'caja',    stock: 6,  min: 5,  cost: 95,   sale: 180  },
    { id: 'seed-prod-008', name: 'Suero fisiológico 500ml',      sku: 'SUE-001', category: 'Sueros',       unit: 'frasco',  stock: 3,  min: 5,  cost: 45,   sale: 90   },
    { id: 'seed-prod-009', name: 'Ketamina 50mg/ml 10ml',        sku: 'ANE-001', category: 'Anestésicos',  unit: 'frasco',  stock: 6,  min: 3,  cost: 380,  sale: 800  },
    { id: 'seed-prod-010', name: 'Isoflurano 250ml',             sku: 'ANE-002', category: 'Anestésicos',  unit: 'frasco',  stock: 2,  min: 3,  cost: 850,  sale: 1800 },
  ];

  for (const p of productDefs) {
    await prisma.product.upsert({
      where: { clinicId_sku: { clinicId: proClinic.id, sku: p.sku } },
      update: {},
      create: {
        id: p.id,
        clinicId: proClinic.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        unit: p.unit,
        currentStock: p.stock,
        minStock: p.min,
        costPrice: p.cost,
        salePrice: p.sale,
      },
    });

    await prisma.stockMovement.upsert({
      where: { id: `seed-mov-initial-${p.id}` },
      update: {},
      create: {
        id: `seed-mov-initial-${p.id}`,
        productId: p.id,
        clinicId: proClinic.id,
        userId: proAdmin.id,
        type: MovementType.IN,
        quantity: p.stock,
        notes: 'Stock inicial',
      },
    });
  }

  // ── Citas ─────────────────────────────────────────────────────────────────

  const slot = (date: string, hour: string, minutes = 30) => {
    const [y, mo, d] = date.split('-').map(Number);
    const [h, m] = hour.split(':').map(Number);
    const start = new Date(y, mo - 1, d, h, m, 0, 0);
    const end = new Date(start.getTime() + minutes * 60_000);
    return { startsAt: start, endsAt: end };
  };

  const appointmentDefs = [
    // Pasadas - DONE
    { id: 'seed-appt-0001', pet: luna,     ...slot('2026-05-06', '09:00'), reason: 'Vacunación antirrábica',         status: AppointmentStatus.DONE      },
    { id: 'seed-appt-0002', pet: max,      ...slot('2026-05-08', '10:00'), reason: 'Revisión general anual',         status: AppointmentStatus.DONE      },
    // Pasada - CANCELLED
    { id: 'seed-appt-0003', pet: michi,    ...slot('2026-05-09', '11:00'), reason: 'Control de peso',                status: AppointmentStatus.CANCELLED },
    // Próximas - CONFIRMED
    { id: 'seed-appt-0004', pet: buddy,    ...slot('2026-05-13', '09:00'), reason: 'Primera consulta y vacunas',     status: AppointmentStatus.CONFIRMED },
    { id: 'seed-appt-0005', pet: luna,     ...slot('2026-05-13', '09:30'), reason: 'Seguimiento post-consulta',      status: AppointmentStatus.CONFIRMED },
    { id: 'seed-appt-0006', pet: max,      ...slot('2026-05-14', '10:00'), reason: 'Desparasitación interna',        status: AppointmentStatus.CONFIRMED },
    // Próximas - PENDING
    { id: 'seed-appt-0007', pet: whiskers, ...slot('2026-05-15', '09:00'), reason: 'Revisión dental y limpieza',     status: AppointmentStatus.PENDING   },
    { id: 'seed-appt-0008', pet: buddy,    ...slot('2026-05-16', '11:00'), reason: 'Refuerzo vacuna parvovirus',     status: AppointmentStatus.PENDING   },
  ];

  for (const a of appointmentDefs) {
    await prisma.appointment.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        clinicId: proClinic.id,
        petId: a.pet.id,
        doctorId: proDoctor.id,
        startsAt: a.startsAt,
        endsAt: a.endsAt,
        reason: a.reason,
        status: a.status,
      },
    });
  }

  console.log('✅ Seed completo.\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🔑 Super Admin (acceso al panel /admin)');
  console.log('    superadmin@vetsystem.com / SuperAdmin1234!  (también en Canes Vet)');
  console.log('');
  console.log('  Plan BASIC  — PetCare Básico');
  console.log('    admin@basic.com    / Admin1234!  | doctor@basic.com / Doctor1234!');
  console.log('    Módulos: ninguno extra  |  Bloqueado: Inventario, Reportes');
  console.log('');
  console.log('  Plan PRO    — Canes Vet');
  console.log('    admin@canes.com    / Admin1234!  | doctor@canes.com / Doctor1234!');
  console.log('    Módulos: INVENTORY, REPORTS');
  console.log('');
  console.log('  Plan ENTERPRISE — Elite Animal Hospital');
  console.log('    admin@elite.com    / Admin1234!  | doctor@elite.com / Doctor1234!');
  console.log('    Módulos: INVENTORY, REPORTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
