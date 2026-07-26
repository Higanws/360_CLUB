/**
 * Desarrollo: `npm run db:seed` — limpia tablas MVP e inserta datos demo vía PrismaClient.
 * Requiere migraciones aplicadas (`npm run db:migrate:deploy`).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** bcrypt: admin→admin, staff→staff, ana/luis→member123 */
const HASH_ADMIN =
  '$2b$10$am//pywdU8mUGWXufZglo.MbjgjiMX22hNdU5a1K93sFXb8BOkGJm';
const HASH_STAFF =
  '$2b$10$zZfG6sfkoUx.dje.EOcnSenNHULqb4zqQ3FS/Sn8JQfEH8oTYkO1a';
const HASH_MEMBER =
  '$2b$10$VUJLd1DP3..rc6C3ilaQAuunh1oqnRdLpHYzZn6l5PGXOhee9vkoO';

function todayDate(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Lunes de la semana actual (UTC date). */
function weekStartMonday(base: Date): Date {
  const d = new Date(base);
  const day = d.getUTCDay(); // 0=Dom
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

const MEALS_LUIS = JSON.stringify([
  {
    weekday: 1,
    hour: 8,
    event: 'Desayuno proteico',
    dish: 'Bowl de yogur griego con avena y frutos rojos.',
    ingredients: [
      { name: 'Yogur griego natural', quantity: '200 g' },
      { name: 'Avena en hojuelas', quantity: '40 g' },
      { name: 'Arándanos congelados', quantity: '50 g' },
    ],
  },
  {
    weekday: 1,
    hour: 13,
    event: 'Almuerzo balanceado',
    dish: 'Ensalada de pollo a la plancha con quinoa y aguacate.',
    ingredients: [
      { name: 'Pechuga de pollo', quantity: '150 g' },
      { name: 'Quinoa cocida', quantity: '80 g' },
      { name: 'Aguacate', quantity: '60 g' },
      { name: 'Mix de hojas verdes', quantity: '100 g' },
    ],
  },
  {
    weekday: 1,
    hour: 20,
    event: 'Cena ligera',
    dish: 'Sopa de verduras casera con huevo.',
    ingredients: [
      { name: 'Caldo de verduras', quantity: '350 ml' },
      { name: 'Huevo', quantity: '1 unidad' },
      { name: 'Verduras mixtas', quantity: '150 g' },
    ],
  },
  { weekday: 3, hour: 8, event: 'Desayuno' },
  { weekday: 5, hour: 13, event: 'Almuerzo pre-entreno' },
]);

async function clearAll() {
  // Orden por FKs
  await prisma.clubAccessLog.deleteMany();
  await prisma.memberWeeklyRoutine.deleteMany();
  await prisma.nutritionPlan.deleteMany();
  await prisma.membershipPayment.deleteMany();
  await prisma.posSaleLine.deleteMany();
  await prisma.posSale.deleteMany();
  await prisma.posProduct.deleteMany();
  await prisma.trainingAssignmentTrainer.deleteMany();
  await prisma.trainingAssignmentMember.deleteMany();
  await prisma.trainingAssignment.deleteMany();
  await prisma.trainingRoutineActivity.deleteMany();
  await prisma.trainingRoutine.deleteMany();
  await prisma.activityTrainer.deleteMany();
  await prisma.activityVideo.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.activityCategory.deleteMany();
  await prisma.gymMemberClass.deleteMany();
  await prisma.gymMember.deleteMany();
  await prisma.classSchedule.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.specialization.deleteMany();
  await prisma.gymRole.deleteMany();
  await prisma.generalSetting.deleteMany();
}

async function main() {
  const today = todayDate();
  const weekStart = weekStartMonday(today);

  console.log('[db:seed] Limpiando tablas…');
  await clearAll();

  console.log('[db:seed] Insertando datos demo…');

  await prisma.generalSetting.create({
    data: {
      id: 1,
      name: 'Club360',
      left_header: 'Club360',
      footer: '',
      header_color: '#27272a',
      currency: 'ARS',
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

  await prisma.classSchedule.create({
    data: { id: 1, class_name: 'Spinning 09:00' },
  });

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
        created_date: today,
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
        created_date: today,
      },
      {
        id: 3,
        activated: 1,
        role_name: 'member',
        member_id: '2024001',
        first_name: 'Ana',
        middle_name: '',
        last_name: 'García',
        username: 'ana_member',
        password: HASH_MEMBER,
        email: 'ana@demo.local',
        gender: 'female',
        created_date: today,
        assign_staff_mem: 2,
      },
      {
        id: 4,
        activated: 1,
        role_name: 'member',
        member_id: '2024002',
        first_name: 'Luis',
        middle_name: '',
        last_name: 'Martín',
        username: 'luis_member',
        password: HASH_MEMBER,
        email: 'luis@demo.local',
        gender: 'male',
        created_date: today,
        assign_staff_mem: 2,
      },
    ],
  });

  await prisma.activityCategory.create({ data: { id: 1, name: 'Fuerza' } });

  await prisma.activity.createMany({
    data: [
      {
        id: 1,
        category_id: 1,
        title: 'Press banca',
        description: 'Press plano en banco',
        difficulty_level: 'media',
      },
      {
        id: 2,
        category_id: 1,
        title: 'Remo con mancuerna',
        description: 'Unilateral',
        difficulty_level: 'media',
      },
    ],
  });

  await prisma.activityVideo.createMany({
    data: [
      {
        id: 1,
        activity_id: 1,
        url: 'https://www.youtube.com/watch?v=TAH8RxOS0VI',
        sort_order: 0,
      },
      {
        id: 2,
        activity_id: 2,
        url: 'https://www.youtube.com/watch?v=TAH8RxOS0VI',
        sort_order: 0,
      },
    ],
  });

  await prisma.activityTrainer.createMany({
    data: [
      { id: 1, activity_id: 1, trainer_member_id: 2 },
      { id: 2, activity_id: 2, trainer_member_id: 2 },
    ],
  });

  await prisma.trainingRoutine.create({
    data: {
      id: 1,
      title: 'Rutina demo 4 días',
      description: 'Ejemplo para asignaciones y portal socio',
      difficulty_level: 'media',
    },
  });

  await prisma.trainingRoutineActivity.createMany({
    data: [
      {
        id: 1,
        routine_id: 1,
        activity_id: 1,
        sort_order: 0,
        weight_kg: 40,
        weekdays_mask: 127,
      },
      {
        id: 2,
        routine_id: 1,
        activity_id: 2,
        sort_order: 1,
        weight_kg: 16,
        weekdays_mask: 127,
      },
    ],
  });

  await prisma.trainingAssignment.createMany({
    data: [
      { id: 1, routine_id: 1 },
      { id: 2, routine_id: 1 },
    ],
  });

  await prisma.trainingAssignmentMember.createMany({
    data: [
      { id: 1, assignment_id: 1, member_id: 3 },
      { id: 2, assignment_id: 2, member_id: 4 },
    ],
  });

  await prisma.trainingAssignmentTrainer.createMany({
    data: [
      { id: 1, assignment_id: 1, trainer_member_id: 2 },
      { id: 2, assignment_id: 2, trainer_member_id: 2 },
    ],
  });

  await prisma.posProduct.createMany({
    data: [
      {
        id: 1,
        sku: 'SKU-BEB',
        name: 'Bebida isotónica',
        unit_price: 2.5,
        stock_qty: 48,
        active: 1,
      },
      {
        id: 2,
        sku: 'SKU-TOA',
        name: 'Toalla club',
        unit_price: 8,
        stock_qty: 15,
        active: 1,
      },
    ],
  });

  await prisma.posSale.create({
    data: {
      id: 1,
      total_amount: 12.5,
      created_by: 2,
      payment_method: 'efectivo',
    },
  });

  await prisma.posSaleLine.create({
    data: {
      id: 1,
      sale_id: 1,
      product_id: 1,
      qty: 5,
      unit_price: 2.5,
      line_total: 12.5,
    },
  });

  await prisma.membershipPayment.createMany({
    data: [
      {
        mp_id: 1,
        member_id: 3,
        membership_id: 1,
        membership_amount: 49,
        paid_amount: 25,
        start_date: today,
        end_date: addDays(today, 30),
        membership_status: 'Continue',
        payment_status: '0',
        created_date: today,
        created_by: 2,
      },
      {
        mp_id: 2,
        member_id: 4,
        membership_id: 1,
        membership_amount: 49,
        paid_amount: 49,
        start_date: today,
        end_date: addDays(today, 30),
        membership_status: 'Continue',
        payment_status: '1',
        created_date: today,
        created_by: 2,
      },
    ],
  });

  await prisma.nutritionPlan.createMany({
    data: [
      {
        id: 1,
        member_id: 3,
        valid_from: today,
        valid_to: addDays(today, 90),
        meals_schedule_json: null,
      },
      {
        id: 2,
        member_id: 4,
        valid_from: today,
        valid_to: addDays(today, 90),
        meals_schedule_json: MEALS_LUIS,
      },
    ],
  });

  await prisma.memberWeeklyRoutine.createMany({
    data: [
      {
        id: 1,
        member_id: 3,
        week_start: weekStart,
        routine_snapshot_json: null,
      },
      {
        id: 2,
        member_id: 4,
        week_start: weekStart,
        routine_snapshot_json: null,
      },
    ],
  });

  const now = new Date();
  await prisma.clubAccessLog.createMany({
    data: [
      {
        id: 1,
        member_id: 3,
        access_date: today,
        access_at: now,
        staff_actor_id: 2,
        outcome: 'allowed',
        status_display: 'OK',
        lookup_raw: '2024001',
        days_remaining: 10,
      },
      {
        id: 2,
        member_id: null,
        access_date: today,
        access_at: now,
        staff_actor_id: 2,
        outcome: 'denied_not_found',
        lookup_raw: '99999',
      },
    ],
  });

  console.log('[db:seed] Datos demo aplicados (PrismaClient).');
}

main()
  .catch((e) => {
    console.error('[db:seed] Error:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
