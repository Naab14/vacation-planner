import { AbsenceStatus, LeaveDecision, PrismaClient, Role } from '@prisma/client';
import argon2 from 'argon2';

const db = new PrismaClient();

const PROCESSES = [
  { slug: 'avsyning', name: 'Avsyning' },
  { slug: 'kapselresaren', name: 'Kapselresaren' },
  { slug: 'serialisering', name: 'Serialisering' },
  { slug: 'etikettering', name: 'Etikettering' },
  { slug: 'granskning-uttag-av-dok', name: 'Granskning/uttag av dok' },
];

const OPERATORS: Array<{ name: string; shift: string; certs: string[] }> = [
  { name: 'Anna Lindgren', shift: 'S1', certs: ['avsyning', 'serialisering', 'granskning-uttag-av-dok'] },
  { name: 'Erik Holm', shift: 'S1', certs: ['kapselresaren', 'etikettering'] },
  { name: 'Sara Björk', shift: 'S1', certs: ['avsyning', 'kapselresaren', 'serialisering'] },
  { name: 'Johan Nyman', shift: 'S1', certs: ['serialisering', 'granskning-uttag-av-dok'] },
  { name: 'Klara Dahl', shift: 'S1', certs: ['etikettering', 'avsyning'] },
  { name: 'Oscar Lund', shift: 'S1', certs: ['kapselresaren', 'serialisering'] },
  { name: 'Maja Ek', shift: 'S1', certs: ['avsyning', 'etikettering', 'kapselresaren'] },
  { name: 'Lars Berg', shift: 'S1', certs: ['serialisering', 'etikettering'] },
  { name: 'Hanna Sjögren', shift: 'S2', certs: ['avsyning', 'serialisering'] },
  { name: 'Emil Strand', shift: 'S2', certs: ['kapselresaren', 'granskning-uttag-av-dok'] },
  { name: 'Frida Nordin', shift: 'S2', certs: ['etikettering', 'avsyning', 'serialisering'] },
  { name: 'Gustav Wallin', shift: 'S2', certs: ['kapselresaren', 'etikettering'] },
  { name: 'Lina Åberg', shift: 'S2', certs: ['avsyning', 'granskning-uttag-av-dok'] },
  { name: 'Nils Persson', shift: 'S2', certs: ['serialisering', 'kapselresaren'] },
  { name: 'Elin Moberg', shift: 'S2', certs: ['etikettering', 'avsyning'] },
  { name: 'Axel Svensson', shift: 'S2', certs: ['kapselresaren', 'serialisering', 'etikettering'] },
];

const ICON_COLORS = ['#7c6bff', '#34e0ff', '#46f2a9', '#ffd84d', '#ff4d7d', '#b58cff', '#4dc9ff', '#ff9d2e'];

// index into OPERATORS, weeks, status
const ABSENCES: Array<[number, number, number, AbsenceStatus]> = [
  [0, 16, 18, AbsenceStatus.APPROVED],
  [2, 20, 22, AbsenceStatus.PENDING],
  [4, 17, 17, AbsenceStatus.DRAFT],
  [6, 24, 26, AbsenceStatus.APPROVED],
  [1, 19, 21, AbsenceStatus.PENDING],
  [8, 15, 16, AbsenceStatus.APPROVED],
  [10, 22, 24, AbsenceStatus.DRAFT],
  [13, 18, 19, AbsenceStatus.REQUESTED],
  [9, 25, 26, AbsenceStatus.APPROVED],
  [15, 20, 23, AbsenceStatus.REQUESTED],
];

// Swedish public holidays 2026 by ISO week
const HOLIDAYS_2026 = [
  { week: 1, name: 'Nyårsdagen' },
  { week: 2, name: 'Trettondedag jul' },
  { week: 14, name: 'Långfredagen' },
  { week: 15, name: 'Annandag påsk' },
  { week: 18, name: 'Första maj' },
  { week: 20, name: 'Kristi himmelsfärdsdag' },
  { week: 23, name: 'Sveriges nationaldag' },
  { week: 25, name: 'Midsommarafton' },
  { week: 52, name: 'Julafton' },
  { week: 53, name: 'Nyårsafton' },
];

const PLANNING_YEAR = 2026;

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed');
  }

  const org = await db.organization.upsert({
    where: { id: 'org-default' },
    update: {},
    create: { id: 'org-default', name: 'Semester Planner' },
  });

  await db.settings.upsert({
    where: { orgId: org.id },
    update: {},
    create: {
      orgId: org.id,
      planningYear: PLANNING_YEAR,
      shifts: ['S1', 'S2'],
      visibleWeeks: 12,
      startWeek: 15,
      minStaffing: 1,
      defaultRequired: 2,
      allowedOverlap: 2,
      lockedWeeks: [],
      holidaysRegion: 'SE',
      colorThresholds: { greenAt: 1, yellowWithin: 1 },
    },
  });

  for (const [index, p] of PROCESSES.entries()) {
    await db.process.upsert({
      where: { orgId_slug: { orgId: org.id, slug: p.slug } },
      update: { name: p.name, sortOrder: index },
      create: { orgId: org.id, slug: p.slug, name: p.name, sortOrder: index },
    });
  }
  const processes = await db.process.findMany({ where: { orgId: org.id } });
  const bySlug = new Map(processes.map((p) => [p.slug, p.id]));

  const operatorIds: string[] = [];
  for (const [index, o] of OPERATORS.entries()) {
    const id = `op-${index + 1}`;
    await db.operator.upsert({
      where: { id },
      update: { name: o.name, shift: o.shift },
      create: {
        id,
        orgId: org.id,
        name: o.name,
        shift: o.shift,
        active: true,
        iconColor: ICON_COLORS[index % ICON_COLORS.length],
      },
    });
    operatorIds.push(id);
    for (const slug of o.certs) {
      const processId = bySlug.get(slug);
      if (!processId) continue;
      await db.certification.upsert({
        where: { operatorId_processId: { operatorId: id, processId } },
        update: {},
        create: { operatorId: id, processId },
      });
    }
  }

  // Demand: explicit rows for the summer stretch; other weeks fall back to defaultRequired.
  for (const p of processes) {
    for (let week = 15; week <= 35; week++) {
      await db.demand.upsert({
        where: { processId_year_week: { processId: p.id, year: PLANNING_YEAR, week } },
        update: {},
        create: { processId: p.id, year: PLANNING_YEAR, week, required: 2 },
      });
    }
  }

  const admin = await db.user.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: { role: Role.ADMIN },
    create: {
      orgId: org.id,
      email: adminEmail.toLowerCase(),
      passwordHash: await argon2.hash(adminPassword, { type: argon2.argon2id }),
      role: Role.ADMIN,
    },
  });

  const demoPassword = await argon2.hash('demo-password', { type: argon2.argon2id });
  const manager = await db.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: { orgId: org.id, email: 'manager@example.com', passwordHash: demoPassword, role: Role.MANAGER },
  });
  await db.user.upsert({
    where: { email: 'anna.lindgren@example.com' },
    update: {},
    create: {
      orgId: org.id,
      email: 'anna.lindgren@example.com',
      passwordHash: demoPassword,
      role: Role.EMPLOYEE,
      operatorId: operatorIds[0],
    },
  });

  for (const [index, [opIndex, startWeek, endWeek, status]] of ABSENCES.entries()) {
    const id = `ab-${index + 1}`;
    await db.absenceBlock.upsert({
      where: { id },
      update: {},
      create: {
        id,
        operatorId: operatorIds[opIndex]!,
        year: PLANNING_YEAR,
        startWeek,
        endWeek,
        status,
      },
    });
    if (status !== AbsenceStatus.DRAFT) {
      const existing = await db.leaveEvent.findFirst({ where: { absenceBlockId: id } });
      if (!existing) {
        await db.leaveEvent.create({
          data: {
            absenceBlockId: id,
            requestedById: admin.id,
            decision: LeaveDecision.SUBMITTED,
          },
        });
        if (status === AbsenceStatus.APPROVED) {
          await db.leaveEvent.create({
            data: {
              absenceBlockId: id,
              requestedById: admin.id,
              decidedById: manager.id,
              decision: LeaveDecision.APPROVED,
              comment: 'Godkänd i demo-seed',
            },
          });
        }
      }
    }
  }

  for (const h of HOLIDAYS_2026) {
    await db.holiday.upsert({
      where: { region_year_week_name: { region: 'SE', year: PLANNING_YEAR, week: h.week, name: h.name } },
      update: {},
      create: { region: 'SE', year: PLANNING_YEAR, week: h.week, name: h.name },
    });
  }

  console.log('Seed complete:', {
    operators: operatorIds.length,
    processes: processes.length,
    admin: admin.email,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
