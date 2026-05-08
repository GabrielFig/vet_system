import { PrismaClient, Role, PlanType, PetSex } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hash = (pw: string) => bcrypt.hash(pw, 12);

  // ── Clinics ───────────────────────────────────────────────────────────────

  const basicClinic = await prisma.clinic.upsert({
    where: { slug: 'petcare-basico' },
    update: {},
    create: { name: 'PetCare Básico', slug: 'petcare-basico', licenseKey: 'BASIC-2026-LICENSE', planType: PlanType.BASIC },
  });

  const proClinic = await prisma.clinic.upsert({
    where: { slug: 'canes' },
    update: {},
    create: { name: 'Canes Vet', slug: 'canes', licenseKey: 'CANES-2026-LICENSE', planType: PlanType.PRO },
  });

  const enterpriseClinic = await prisma.clinic.upsert({
    where: { slug: 'elite-animal' },
    update: {},
    create: { name: 'Elite Animal Hospital', slug: 'elite-animal', licenseKey: 'ELITE-2026-LICENSE', planType: PlanType.ENTERPRISE },
  });

  // ── Users ─────────────────────────────────────────────────────────────────

  // BASIC
  const basicAdmin = await prisma.user.upsert({
    where: { email: 'admin@basic.com' },
    update: {},
    create: { email: 'admin@basic.com', passwordHash: await hash('Admin1234!'), firstName: 'María', lastName: 'Torres' },
  });
  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: basicClinic.id, userId: basicAdmin.id } },
    update: {},
    create: { clinicId: basicClinic.id, userId: basicAdmin.id, role: Role.ADMIN },
  });

  const basicDoctor = await prisma.user.upsert({
    where: { email: 'doctor@basic.com' },
    update: {},
    create: { email: 'doctor@basic.com', passwordHash: await hash('Doctor1234!'), firstName: 'Luis', lastName: 'Ramírez' },
  });
  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: basicClinic.id, userId: basicDoctor.id } },
    update: {},
    create: { clinicId: basicClinic.id, userId: basicDoctor.id, role: Role.DOCTOR },
  });

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
  const enterpriseAdmin = await prisma.user.upsert({
    where: { email: 'admin@elite.com' },
    update: {},
    create: { email: 'admin@elite.com', passwordHash: await hash('Admin1234!'), firstName: 'Valentina', lastName: 'Herrera' },
  });
  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: enterpriseClinic.id, userId: enterpriseAdmin.id } },
    update: {},
    create: { clinicId: enterpriseClinic.id, userId: enterpriseAdmin.id, role: Role.ADMIN },
  });

  const enterpriseDoctor = await prisma.user.upsert({
    where: { email: 'doctor@elite.com' },
    update: {},
    create: { email: 'doctor@elite.com', passwordHash: await hash('Doctor1234!'), firstName: 'Andrés', lastName: 'Morales' },
  });
  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: enterpriseClinic.id, userId: enterpriseDoctor.id } },
    update: {},
    create: { clinicId: enterpriseClinic.id, userId: enterpriseDoctor.id, role: Role.DOCTOR },
  });

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
  console.log('  Plan BASIC  — PetCare Básico');
  console.log('    admin@basic.com    / Admin1234!  (ADMIN)');
  console.log('    doctor@basic.com   / Doctor1234! (DOCTOR)');
  console.log('    Acceso: Clientes, Mascotas, Citas, Historial médico');
  console.log('    Bloqueado: Inventario, Reportes');
  console.log('');
  console.log('  Plan PRO    — Canes Vet');
  console.log('    admin@canes.com    / Admin1234!  (ADMIN)');
  console.log('    doctor@canes.com   / Doctor1234! (DOCTOR)');
  console.log('    Acceso: Todo BASIC + Inventario + Reportes de citas');
  console.log('');
  console.log('  Plan ENTERPRISE — Elite Animal Hospital');
  console.log('    admin@elite.com    / Admin1234!  (ADMIN)');
  console.log('    doctor@elite.com   / Doctor1234! (DOCTOR)');
  console.log('    Acceso: Todo PRO + features premium (acceso completo)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
