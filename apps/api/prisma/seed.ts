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

  // ── DEMO: Clínica Veterinaria San Lucas ──────────────────────────────────

  const demoClinic = await upsertClinicWithModules({
    slug: 'san-lucas',
    name: 'Clínica Veterinaria San Lucas',
    licenseKey: 'DEMO-2026-SANLUCAS',
    planType: PlanType.PRO,
  });

  const demoAdmin = await prisma.user.upsert({
    where: { email: 'patricia@sanlucas.com' },
    update: {},
    create: { email: 'patricia@sanlucas.com', passwordHash: await hash('Admin1234!'), firstName: 'Patricia', lastName: 'Vega' },
  });
  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: demoClinic.id, userId: demoAdmin.id } },
    update: {},
    create: { clinicId: demoClinic.id, userId: demoAdmin.id, role: Role.ADMIN },
  });

  const demoDoctor1 = await prisma.user.upsert({
    where: { email: 'miguel@sanlucas.com' },
    update: {},
    create: { email: 'miguel@sanlucas.com', passwordHash: await hash('Doctor1234!'), firstName: 'Miguel Ángel', lastName: 'Reyes' },
  });
  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: demoClinic.id, userId: demoDoctor1.id } },
    update: {},
    create: { clinicId: demoClinic.id, userId: demoDoctor1.id, role: Role.DOCTOR },
  });

  const demoDoctor2 = await prisma.user.upsert({
    where: { email: 'fernanda@sanlucas.com' },
    update: {},
    create: { email: 'fernanda@sanlucas.com', passwordHash: await hash('Doctor1234!'), firstName: 'Fernanda', lastName: 'Cruz' },
  });
  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: demoClinic.id, userId: demoDoctor2.id } },
    update: {},
    create: { clinicId: demoClinic.id, userId: demoDoctor2.id, role: Role.DOCTOR },
  });

  // Horario Lun-Sáb 08:00-19:00
  await prisma.clinicSchedule.upsert({
    where: { clinicId: demoClinic.id },
    update: {},
    create: { clinicId: demoClinic.id, workDays: [1, 2, 3, 4, 5, 6], startTime: '08:00', endTime: '19:00', slotMinutes: 30 },
  });

  // ── Clientes demo ─────────────────────────────────────────────────────────

  const [slRoberto, slLaura, slJorge, slAlejandra, slHector, slDaniela] = await Promise.all([
    prisma.client.upsert({ where: { id: 'seed-sl-client-001' }, update: {}, create: { id: 'seed-sl-client-001', clinicId: demoClinic.id, firstName: 'Roberto',   lastName: 'Gutiérrez', phone: '+52 55 1111 2222', email: 'roberto.gutierrez@email.com' } }),
    prisma.client.upsert({ where: { id: 'seed-sl-client-002' }, update: {}, create: { id: 'seed-sl-client-002', clinicId: demoClinic.id, firstName: 'Laura',     lastName: 'Sánchez',   phone: '+52 55 3333 4444', email: 'laura.sanchez@email.com' } }),
    prisma.client.upsert({ where: { id: 'seed-sl-client-003' }, update: {}, create: { id: 'seed-sl-client-003', clinicId: demoClinic.id, firstName: 'Jorge',     lastName: 'Mendoza',   phone: '+52 55 5555 6666', email: 'jorge.mendoza@email.com' } }),
    prisma.client.upsert({ where: { id: 'seed-sl-client-004' }, update: {}, create: { id: 'seed-sl-client-004', clinicId: demoClinic.id, firstName: 'Alejandra', lastName: 'Vázquez',   phone: '+52 55 7777 8888', email: 'alejandra.vazquez@email.com' } }),
    prisma.client.upsert({ where: { id: 'seed-sl-client-005' }, update: {}, create: { id: 'seed-sl-client-005', clinicId: demoClinic.id, firstName: 'Héctor',    lastName: 'Jiménez',   phone: '+52 55 9999 0000', email: 'hector.jimenez@email.com' } }),
    prisma.client.upsert({ where: { id: 'seed-sl-client-006' }, update: {}, create: { id: 'seed-sl-client-006', clinicId: demoClinic.id, firstName: 'Daniela',   lastName: 'Ríos',      phone: '+52 55 2222 3333', email: 'daniela.rios@email.com' } }),
  ]);

  // ── Mascotas demo ─────────────────────────────────────────────────────────

  const slRocky = await prisma.pet.upsert({
    where: { id: 'seed-sl-pet-001' }, update: {},
    create: { id: 'seed-sl-pet-001', clientId: slRoberto.id, name: 'Rocky',   species: 'dog',    breed: 'Bulldog Francés',    sex: PetSex.MALE,   birthDate: new Date('2023-02-10'), weight: 12.0 },
  });
  const slCoco = await prisma.pet.upsert({
    where: { id: 'seed-sl-pet-002' }, update: {},
    create: { id: 'seed-sl-pet-002', clientId: slRoberto.id, name: 'Coco',    species: 'dog',    breed: 'Chihuahua',          sex: PetSex.FEMALE, birthDate: new Date('2021-08-22'), weight: 2.5 },
  });
  const slNala = await prisma.pet.upsert({
    where: { id: 'seed-sl-pet-003' }, update: {},
    create: { id: 'seed-sl-pet-003', clientId: slLaura.id,   name: 'Nala',    species: 'cat',    breed: 'Maine Coon',         sex: PetSex.FEMALE, birthDate: new Date('2024-01-15'), weight: 5.2 },
  });
  const slPelusa = await prisma.pet.upsert({
    where: { id: 'seed-sl-pet-004' }, update: {},
    create: { id: 'seed-sl-pet-004', clientId: slLaura.id,   name: 'Pelusa',  species: 'cat',    breed: 'Angora',             sex: PetSex.FEMALE, birthDate: new Date('2022-05-30'), weight: 3.8 },
  });
  const slThor = await prisma.pet.upsert({
    where: { id: 'seed-sl-pet-005' }, update: {},
    create: { id: 'seed-sl-pet-005', clientId: slJorge.id,   name: 'Thor',    species: 'dog',    breed: 'Rottweiler',         sex: PetSex.MALE,   birthDate: new Date('2024-03-05'), weight: 38.5 },
  });
  const slCanela = await prisma.pet.upsert({
    where: { id: 'seed-sl-pet-006' }, update: {},
    create: { id: 'seed-sl-pet-006', clientId: slAlejandra.id, name: 'Canela', species: 'dog',   breed: 'Cocker Spaniel',     sex: PetSex.FEMALE, birthDate: new Date('2020-09-14'), weight: 13.2 },
  });
  const slSimba = await prisma.pet.upsert({
    where: { id: 'seed-sl-pet-007' }, update: {},
    create: { id: 'seed-sl-pet-007', clientId: slAlejandra.id, name: 'Simba',  species: 'cat',   breed: 'Bengalí',            sex: PetSex.MALE,   birthDate: new Date('2025-02-18'), weight: 4.1 },
  });
  const slManchas = await prisma.pet.upsert({
    where: { id: 'seed-sl-pet-008' }, update: {},
    create: { id: 'seed-sl-pet-008', clientId: slHector.id,  name: 'Manchas', species: 'dog',    breed: 'Dálmata',            sex: PetSex.MALE,   birthDate: new Date('2022-11-20'), weight: 27.0 },
  });
  const slKira = await prisma.pet.upsert({
    where: { id: 'seed-sl-pet-009' }, update: {},
    create: { id: 'seed-sl-pet-009', clientId: slHector.id,  name: 'Kira',    species: 'dog',    breed: 'Husky Siberiano',    sex: PetSex.FEMALE, birthDate: new Date('2023-07-03'), weight: 21.5 },
  });
  const slGreta = await prisma.pet.upsert({
    where: { id: 'seed-sl-pet-010' }, update: {},
    create: { id: 'seed-sl-pet-010', clientId: slDaniela.id, name: 'Greta',   species: 'rabbit', breed: 'Nueva Zelanda',      sex: PetSex.FEMALE, birthDate: new Date('2024-06-01'), weight: 2.8 },
  });

  // Expedientes médicos
  const slPets = [slRocky, slCoco, slNala, slPelusa, slThor, slCanela, slSimba, slManchas, slKira, slGreta];
  for (const pet of slPets) {
    await prisma.medicalRecord.upsert({ where: { petId: pet.id }, update: {}, create: { petId: pet.id } });
  }

  // ── Inventario demo (SKUs SL-) ────────────────────────────────────────────

  const slProducts = [
    { id: 'seed-sl-prod-001', name: 'Vacuna Antirrábica Defensor',   sku: 'SL-VAC-001', category: 'Vacunas',      unit: 'dosis',   stock: 32, min: 10, cost: 115,  sale: 240  },
    { id: 'seed-sl-prod-002', name: 'Vacuna Séxtuple Canina',        sku: 'SL-VAC-002', category: 'Vacunas',      unit: 'dosis',   stock: 18, min: 8,  cost: 210,  sale: 420  },
    { id: 'seed-sl-prod-003', name: 'Vacuna Triple Felina',          sku: 'SL-VAC-003', category: 'Vacunas',      unit: 'dosis',   stock: 14, min: 6,  cost: 190,  sale: 380  },
    { id: 'seed-sl-prod-004', name: 'Amoxicilina 250mg',             sku: 'SL-MED-001', category: 'Medicamentos', unit: 'tableta', stock: 200,min: 50, cost: 3,    sale: 10   },
    { id: 'seed-sl-prod-005', name: 'Enrofloxacina 50mg',            sku: 'SL-MED-002', category: 'Medicamentos', unit: 'tableta', stock: 120,min: 30, cost: 6,    sale: 18   },
    { id: 'seed-sl-prod-006', name: 'Prednisolona 5mg',              sku: 'SL-MED-003', category: 'Medicamentos', unit: 'tableta', stock: 90, min: 20, cost: 4,    sale: 14   },
    { id: 'seed-sl-prod-007', name: 'Ivermectina 1% 50ml',           sku: 'SL-MED-004', category: 'Medicamentos', unit: 'frasco',  stock: 8,  min: 3,  cost: 95,   sale: 200  },
    { id: 'seed-sl-prod-008', name: 'Guantes nitrilo caja x100',     sku: 'SL-MAT-001', category: 'Materiales',   unit: 'caja',    stock: 10, min: 4,  cost: 90,   sale: 160  },
    { id: 'seed-sl-prod-009', name: 'Catéter 22G caja x50',          sku: 'SL-MAT-002', category: 'Materiales',   unit: 'caja',    stock: 4,  min: 3,  cost: 120,  sale: 230  },
    { id: 'seed-sl-prod-010', name: 'Clorhexidina 2% 1L',            sku: 'SL-MAT-003', category: 'Materiales',   unit: 'litro',   stock: 5,  min: 2,  cost: 65,   sale: 130  },
    { id: 'seed-sl-prod-011', name: 'Suero Ringer Lactato 500ml',    sku: 'SL-SUE-001', category: 'Sueros',       unit: 'frasco',  stock: 12, min: 6,  cost: 42,   sale: 85   },
    { id: 'seed-sl-prod-012', name: 'Propofol 10mg/ml 20ml',         sku: 'SL-ANE-001', category: 'Anestésicos',  unit: 'frasco',  stock: 5,  min: 3,  cost: 420,  sale: 900  },
  ];

  for (const p of slProducts) {
    await prisma.product.upsert({
      where: { clinicId_sku: { clinicId: demoClinic.id, sku: p.sku } },
      update: {},
      create: { id: p.id, clinicId: demoClinic.id, name: p.name, sku: p.sku, category: p.category, unit: p.unit, currentStock: p.stock, minStock: p.min, costPrice: p.cost, salePrice: p.sale },
    });
    await prisma.stockMovement.upsert({
      where: { id: `seed-sl-mov-${p.id}` }, update: {},
      create: { id: `seed-sl-mov-${p.id}`, productId: p.id, clinicId: demoClinic.id, userId: demoAdmin.id, type: MovementType.IN, quantity: p.stock, notes: 'Stock inicial' },
    });
  }

  // ── Citas + Consultas demo ────────────────────────────────────────────────

  const slAppts = [
    { id: 'seed-sl-appt-001', pet: slRocky,   ...slot('2026-04-21', '09:00'), reason: 'Otitis externa',            status: AppointmentStatus.DONE,      doctor: demoDoctor1 },
    { id: 'seed-sl-appt-002', pet: slCanela,  ...slot('2026-04-24', '10:00'), reason: 'Gastroenteritis aguda',     status: AppointmentStatus.DONE,      doctor: demoDoctor2 },
    { id: 'seed-sl-appt-003', pet: slManchas, ...slot('2026-05-02', '09:30'), reason: 'Vacunación anual',          status: AppointmentStatus.DONE,      doctor: demoDoctor1 },
    { id: 'seed-sl-appt-004', pet: slNala,    ...slot('2026-05-05', '11:00'), reason: 'Control post-castración',   status: AppointmentStatus.DONE,      doctor: demoDoctor2 },
    { id: 'seed-sl-appt-005', pet: slThor,    ...slot('2026-05-08', '09:00'), reason: 'Primera vacuna cachorros',  status: AppointmentStatus.DONE,      doctor: demoDoctor1 },
    { id: 'seed-sl-appt-006', pet: slCoco,    ...slot('2026-05-09', '10:30'), reason: 'Revisión dental',           status: AppointmentStatus.CANCELLED, doctor: demoDoctor2 },
    // Hoy (2026-05-12)
    { id: 'seed-sl-appt-007', pet: slKira,    ...slot('2026-05-12', '09:00'), reason: 'Revisión general',          status: AppointmentStatus.CONFIRMED, doctor: demoDoctor1 },
    { id: 'seed-sl-appt-008', pet: slSimba,   ...slot('2026-05-12', '10:00'), reason: 'Vacuna triple felina',      status: AppointmentStatus.CONFIRMED, doctor: demoDoctor2 },
    { id: 'seed-sl-appt-009', pet: slGreta,   ...slot('2026-05-12', '11:30'), reason: 'Control de peso y dieta',   status: AppointmentStatus.CONFIRMED, doctor: demoDoctor1 },
    // Próximas
    { id: 'seed-sl-appt-010', pet: slRocky,   ...slot('2026-05-14', '09:00'), reason: 'Seguimiento otitis',        status: AppointmentStatus.CONFIRMED, doctor: demoDoctor1 },
    { id: 'seed-sl-appt-011', pet: slPelusa,  ...slot('2026-05-14', '10:30'), reason: 'Desparasitación interna',   status: AppointmentStatus.CONFIRMED, doctor: demoDoctor2 },
    { id: 'seed-sl-appt-012', pet: slThor,    ...slot('2026-05-16', '09:00'), reason: 'Refuerzo vacuna séxtuple',  status: AppointmentStatus.PENDING,   doctor: demoDoctor1 },
    { id: 'seed-sl-appt-013', pet: slManchas, ...slot('2026-05-19', '11:00'), reason: 'Limpieza dental',           status: AppointmentStatus.PENDING,   doctor: demoDoctor2 },
    { id: 'seed-sl-appt-014', pet: slCoco,    ...slot('2026-05-20', '09:30'), reason: 'Revisión dental',           status: AppointmentStatus.PENDING,   doctor: demoDoctor1 },
  ];

  for (const a of slAppts) {
    await prisma.appointment.upsert({
      where: { id: a.id }, update: {},
      create: { id: a.id, clinicId: demoClinic.id, petId: a.pet.id, doctorId: a.doctor.id, startsAt: a.startsAt, endsAt: a.endsAt, reason: a.reason, status: a.status },
    });
  }

  // ── Consultas con historial clínico ──────────────────────────────────────

  // Helper: obtiene el record de una mascota demo
  async function slRecord(petId: string) {
    return prisma.medicalRecord.findUnique({ where: { petId } });
  }

  // Rocky — Otitis externa
  const recRocky = await slRecord(slRocky.id);
  const slConsult1 = await prisma.consultation.upsert({
    where: { id: 'seed-sl-consult-001' }, update: {},
    create: { id: 'seed-sl-consult-001', recordId: recRocky!.id, clinicId: demoClinic.id, doctorId: demoDoctor1.id, reason: 'Otitis externa', appointmentId: 'seed-sl-appt-001', createdAt: new Date('2026-04-21') },
  });
  await prisma.medicalNote.upsert({
    where: { consultationId: slConsult1.id }, update: {},
    create: { consultationId: slConsult1.id, clinicId: demoClinic.id, authorId: demoDoctor1.id, title: 'Otitis externa bilateral', content: 'Paciente masculino de 3 años, peso 12 kg. Se presenta con rascado frecuente de oídos y sacudidas de cabeza. A la otoscopía se observa eritema bilateral y secreción marrón oscura en ambos canales auditivos. Sin perforación timpánica. Diagnóstico: otitis externa por Malassezia. Se inicia tratamiento local y sistémico.' },
  });
  await prisma.prescription.upsert({
    where: { id: 'seed-sl-presc-001' }, update: {},
    create: { id: 'seed-sl-presc-001', consultationId: slConsult1.id, clinicId: demoClinic.id, doctorId: demoDoctor1.id, diagnosis: 'Otitis externa bilateral por Malassezia', medications: 'Posatex gotas óticas — 4 gotas en cada oído cada 24h por 7 días\nPrednisolona 5mg — 1 tableta cada 12h por 5 días', instructions: 'Limpiar el canal auditivo con solución ótica antes de aplicar las gotas. Citar en 2 semanas para control.', validUntil: new Date('2026-05-21') },
  });

  // Canela — Gastroenteritis
  const recCanela = await slRecord(slCanela.id);
  const slConsult2 = await prisma.consultation.upsert({
    where: { id: 'seed-sl-consult-002' }, update: {},
    create: { id: 'seed-sl-consult-002', recordId: recCanela!.id, clinicId: demoClinic.id, doctorId: demoDoctor2.id, reason: 'Gastroenteritis aguda', appointmentId: 'seed-sl-appt-002', createdAt: new Date('2026-04-24') },
  });
  await prisma.medicalNote.upsert({
    where: { consultationId: slConsult2.id }, update: {},
    create: { consultationId: slConsult2.id, clinicId: demoClinic.id, authorId: demoDoctor2.id, title: 'Gastroenteritis aguda', content: 'Hembra de 6 años, peso 13.2 kg. Dueña reporta vómito 3 veces en las últimas 12 horas y diarrea líquida. Sin sangre en heces. Temperatura 39.4°C. Abdomen levemente tenso a la palpación. Mucosas rosadas, deshidratación leve (~5%). Se administra suero Ringer Lactato 150ml SC. Se prescribe dieta blanda por 48 horas.' },
  });
  await prisma.prescription.upsert({
    where: { id: 'seed-sl-presc-002' }, update: {},
    create: { id: 'seed-sl-presc-002', consultationId: slConsult2.id, clinicId: demoClinic.id, doctorId: demoDoctor2.id, diagnosis: 'Gastroenteritis aguda, deshidratación leve', medications: 'Metronidazol 250mg — 1 tableta cada 12h por 5 días\nOmeprazol 20mg — 1 cápsula cada 24h por 5 días', instructions: 'Dieta blanda las primeras 48h (pollo hervido con arroz). Ofrecer agua en pequeñas cantidades frecuentes. Regresar si el vómito persiste más de 24h.', validUntil: new Date('2026-05-24') },
  });

  // Manchas — Vacunación anual
  const recManchas = await slRecord(slManchas.id);
  const slConsult3 = await prisma.consultation.upsert({
    where: { id: 'seed-sl-consult-003' }, update: {},
    create: { id: 'seed-sl-consult-003', recordId: recManchas!.id, clinicId: demoClinic.id, doctorId: demoDoctor1.id, reason: 'Vacunación anual', appointmentId: 'seed-sl-appt-003', createdAt: new Date('2026-05-02') },
  });
  await prisma.medicalNote.upsert({
    where: { consultationId: slConsult3.id }, update: {},
    create: { consultationId: slConsult3.id, clinicId: demoClinic.id, authorId: demoDoctor1.id, title: 'Revisión anual y vacunación', content: 'Macho entero de 4 años, peso 27 kg. Paciente alerta y en excelente condición corporal. Sin alteraciones en exploración física completa. Auscultación cardiopulmonar normal. Dentición con sarro leve grado I. Se aplican vacunas anuales. Se recomienda limpieza dental en próxima visita.' },
  });
  await prisma.vaccination.upsert({
    where: { id: 'seed-sl-vacc-001' }, update: {},
    create: { id: 'seed-sl-vacc-001', consultationId: slConsult3.id, clinicId: demoClinic.id, appliedById: demoDoctor1.id, vaccineName: 'Séxtuple Canina', batch: 'SXT-2026-042', appliedAt: new Date('2026-05-02'), nextDose: new Date('2027-05-02') },
  });
  await prisma.vaccination.upsert({
    where: { id: 'seed-sl-vacc-002' }, update: {},
    create: { id: 'seed-sl-vacc-002', consultationId: slConsult3.id, clinicId: demoClinic.id, appliedById: demoDoctor1.id, vaccineName: 'Antirrábica Defensor', batch: 'RAB-2026-118', appliedAt: new Date('2026-05-02'), nextDose: new Date('2027-05-02') },
  });

  // Nala — Post-castración
  const recNala = await slRecord(slNala.id);
  const slConsult4 = await prisma.consultation.upsert({
    where: { id: 'seed-sl-consult-004' }, update: {},
    create: { id: 'seed-sl-consult-004', recordId: recNala!.id, clinicId: demoClinic.id, doctorId: demoDoctor2.id, reason: 'Control post-castración', appointmentId: 'seed-sl-appt-004', createdAt: new Date('2026-05-05') },
  });
  await prisma.medicalNote.upsert({
    where: { consultationId: slConsult4.id }, update: {},
    create: { consultationId: slConsult4.id, clinicId: demoClinic.id, authorId: demoDoctor2.id, title: 'Control post-quirúrgico día 7', content: 'Hembra de 2 años, peso 5.2 kg. Control a los 7 días post-ovariohisterectomía electiva. Herida quirúrgica limpia, sin signos de infección ni dehiscencia. Puntos íntegros. Apetito normal, activa. Se retiran suturas. Alta médica con recomendaciones de manejo.' },
  });
  await prisma.prescription.upsert({
    where: { id: 'seed-sl-presc-003' }, update: {},
    create: { id: 'seed-sl-presc-003', consultationId: slConsult4.id, clinicId: demoClinic.id, doctorId: demoDoctor2.id, diagnosis: 'Post-OHE día 7, evolución satisfactoria', medications: 'Meloxicam 0.5mg/kg — 1 dosis cada 24h por 3 días más', instructions: 'Continuar con collar isabelino 3 días más. Evitar saltos y ejercicio intenso por 2 semanas. Alta definitiva.', validUntil: new Date('2026-05-20') },
  });

  // Thor — Primera vacuna cachorros
  const recThor = await slRecord(slThor.id);
  const slConsult5 = await prisma.consultation.upsert({
    where: { id: 'seed-sl-consult-005' }, update: {},
    create: { id: 'seed-sl-consult-005', recordId: recThor!.id, clinicId: demoClinic.id, doctorId: demoDoctor1.id, reason: 'Primera vacuna cachorros', appointmentId: 'seed-sl-appt-005', createdAt: new Date('2026-05-08') },
  });
  await prisma.medicalNote.upsert({
    where: { consultationId: slConsult5.id }, update: {},
    create: { consultationId: slConsult5.id, clinicId: demoClinic.id, authorId: demoDoctor1.id, title: 'Primera consulta — esquema de vacunación', content: 'Macho de 2 meses, peso 38.5 kg (raza grande). Cachorro con buen desarrollo y reflejos adecuados. Mucosas rosadas, hidratación normal. Sin parásitos externos. Primer contacto con la clínica. Se inicia esquema vacunal. Se orienta al dueño sobre desparasitación y alimentación para razas grandes.' },
  });
  await prisma.vaccination.upsert({
    where: { id: 'seed-sl-vacc-003' }, update: {},
    create: { id: 'seed-sl-vacc-003', consultationId: slConsult5.id, clinicId: demoClinic.id, appliedById: demoDoctor1.id, vaccineName: 'Séxtuple Canina 1ª dosis', batch: 'SXT-2026-047', appliedAt: new Date('2026-05-08'), nextDose: new Date('2026-06-08') },
  });

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
  console.log('');
  console.log('  ⭐ DEMO — Clínica Veterinaria San Lucas (para presentación)');
  console.log('    patricia@sanlucas.com / Admin1234!   (Administrador)');
  console.log('    miguel@sanlucas.com   / Doctor1234!  (Dr. Miguel Ángel Reyes)');
  console.log('    fernanda@sanlucas.com / Doctor1234!  (Dra. Fernanda Cruz)');
  console.log('    6 clientes · 10 mascotas · 5 consultas con historial');
  console.log('    12 productos en inventario · 3 citas programadas para hoy');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
