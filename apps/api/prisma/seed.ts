import { PrismaClient, Role, PlanType, PetSex, ClinicModuleType } from '@prisma/client';
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
