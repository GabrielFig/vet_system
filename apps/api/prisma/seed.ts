import { PrismaClient, Role, PlanType, PetSex } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const canesClinic = await prisma.clinic.upsert({
    where: { slug: 'canes' },
    update: {},
    create: { name: 'Canes Vet', slug: 'canes', licenseKey: 'CANES-2026-LICENSE', planType: PlanType.PRO },
  });

  const mininosClinic = await prisma.clinic.upsert({
    where: { slug: 'mininos' },
    update: {},
    create: { name: 'Mininos Vet', slug: 'mininos', licenseKey: 'MININOS-2026-LICENSE', planType: PlanType.BASIC },
  });

  const hash = (pw: string) => bcrypt.hash(pw, 12);

  const canesAdmin = await prisma.user.upsert({
    where: { email: 'admin@canes.com' },
    update: {},
    create: { email: 'admin@canes.com', passwordHash: await hash('Admin1234!'), firstName: 'Carlos', lastName: 'Mendoza' },
  });
  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: canesClinic.id, userId: canesAdmin.id } },
    update: {},
    create: { clinicId: canesClinic.id, userId: canesAdmin.id, role: Role.ADMIN },
  });

  const canesDoctor = await prisma.user.upsert({
    where: { email: 'doctor@canes.com' },
    update: {},
    create: { email: 'doctor@canes.com', passwordHash: await hash('Doctor1234!'), firstName: 'Roberto', lastName: 'García' },
  });
  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: canesClinic.id, userId: canesDoctor.id } },
    update: {},
    create: { clinicId: canesClinic.id, userId: canesDoctor.id, role: Role.DOCTOR },
  });

  const mininosAdmin = await prisma.user.upsert({
    where: { email: 'admin@mininos.com' },
    update: {},
    create: { email: 'admin@mininos.com', passwordHash: await hash('Admin1234!'), firstName: 'Laura', lastName: 'Sánchez' },
  });
  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: mininosClinic.id, userId: mininosAdmin.id } },
    update: {},
    create: { clinicId: mininosClinic.id, userId: mininosAdmin.id, role: Role.ADMIN },
  });

  const mininosDoctor = await prisma.user.upsert({
    where: { email: 'doctor@mininos.com' },
    update: {},
    create: { email: 'doctor@mininos.com', passwordHash: await hash('Doctor1234!'), firstName: 'Elena', lastName: 'López' },
  });
  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: mininosClinic.id, userId: mininosDoctor.id } },
    update: {},
    create: { clinicId: mininosClinic.id, userId: mininosDoctor.id, role: Role.DOCTOR },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo.com' },
    update: {},
    create: { email: 'owner@demo.com', passwordHash: await hash('Owner1234!'), firstName: 'Ana', lastName: 'Rodríguez' },
  });
  await prisma.clinicUser.upsert({
    where: { clinicId_userId: { clinicId: canesClinic.id, userId: owner.id } },
    update: {},
    create: { clinicId: canesClinic.id, userId: owner.id, role: Role.OWNER },
  });

  const luna = await prisma.pet.upsert({
    where: { id: 'seed-luna-pet-id-00000000000000000001' },
    update: {},
    create: {
      id: 'seed-luna-pet-id-00000000000000000001',
      ownerId: owner.id,
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
      content:
        'Paciente en buen estado general. Peso 28kg. Sin alteraciones en auscultación cardiopulmonar. Mucosas rosadas. Temperatura normal.',
    },
  });

  await prisma.prescription.upsert({
    where: { id: 'seed-luna-presc1-0000000000000000001' },
    update: {},
    create: {
      id: 'seed-luna-presc1-0000000000000000001',
      consultationId: lunaConsult1.id,
      clinicId: canesClinic.id,
      doctorId: canesDoctor.id,
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
      clinicId: canesClinic.id,
      appliedById: canesDoctor.id,
      vaccineName: 'Antirrábica',
      batch: 'RABV-2026-001',
      appliedAt: new Date('2026-05-05'),
      nextDose: new Date('2027-05-05'),
    },
  });

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
      content:
        'Peso estable en 28kg. Se recomienda reducir porción diaria de alimento balanceado a 300g. Próxima cita en 30 días.',
    },
  });

  const michi = await prisma.pet.upsert({
    where: { id: 'seed-michi-pet-id-00000000000000000002' },
    update: {},
    create: {
      id: 'seed-michi-pet-id-00000000000000000002',
      ownerId: owner.id,
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
