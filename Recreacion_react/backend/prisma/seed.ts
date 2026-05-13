import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Mismos hashes bcrypt que `database/seed/seed_mvp_mysql.sql` (admin / staff demo). */
const HASH_ADMIN =
  '$2b$10$am//pywdU8mUGWXufZglo.MbjgjiMX22hNdU5a1K93sFXb8BOkGJm';
const HASH_STAFF =
  '$2b$10$zZfG6sfkoUx.dje.EOcnSenNHULqb4zqQ3FS/Sn8JQfEH8oTYkO1a';

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function clearMvpData(): Promise<void> {
  await prisma.$transaction([
    prisma.posSaleLine.deleteMany(),
    prisma.posSale.deleteMany(),
    prisma.posProduct.deleteMany(),
    prisma.membershipPayment.deleteMany(),
    prisma.gymMemberClass.deleteMany(),
    prisma.gymMember.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.classSchedule.deleteMany(),
    prisma.specialization.deleteMany(),
    prisma.gymRole.deleteMany(),
    prisma.generalSetting.deleteMany(),
  ]);
}

async function seedMvp(): Promise<void> {
  await prisma.generalSetting.create({
    data: {
      id: 1,
      name: 'Club360',
      gym_logo: null,
      left_header: 'Club360',
      footer: '',
      header_color: '#27272a',
      currency: 'EUR',
      member_can_view_other: 0,
      staff_can_view_own_member: 0,
      date_format: 'd/m/Y',
    },
  });

  await prisma.gymRole.create({ data: { id: 1, name: 'General' } });
  await prisma.specialization.create({ data: { id: 1, name: 'General' } });

  await prisma.membership.createMany({
    data: [
      {
        id: 1,
        membership_label: 'Plan básico',
        membership_amount: 49,
        membership_period_days: 30,
        installment_plan: '1 mes',
        signup_fee: 5,
      },
      {
        id: 2,
        membership_label: 'Plan completo',
        membership_amount: 79,
        membership_period_days: 30,
        installment_plan: '1 mes',
        signup_fee: 5,
      },
    ],
  });

  const t = todayDate();

  await prisma.gymMember.createMany({
    data: [
      {
        id: 1,
        activated: 1,
        role_name: 'administrator',
        first_name: 'Admin',
        middle_name: '',
        last_name: 'Club360',
        username: 'admin',
        password: HASH_ADMIN,
        email: 'admin@local.test',
        role: null,
        gender: null,
        created_date: t,
      },
      {
        id: 2,
        activated: 1,
        role_name: 'staff_member',
        first_name: 'Staff',
        middle_name: '',
        last_name: 'Demo',
        username: 'staff',
        password: HASH_STAFF,
        email: 'staff@local.test',
        role: 1,
        gender: 'male',
        created_date: t,
      },
    ],
  });
}

async function main(): Promise<void> {
  await clearMvpData();
  await seedMvp();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
