import {
  PrismaClient,
  Role,
  ItemUnit,
  AddOnScope,
  PricingMode,
  Service,
  TicketStatus,
  PaymentStatus,
  TicketSource,
} from "@prisma/client";
import { hash } from "@node-rs/argon2";

const db = new PrismaClient();

const ARGON_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

async function main() {
  console.log("🌱 Seeding Abkon Laundromat…");

  // ─── Branch ────────────────────────────────────────────────────────────
  const branch = await db.branch.upsert({
    where: { code: "AB" },
    update: {},
    create: {
      name: "Abkon Laundromat — Main",
      code: "AB",
      address: "Main showroom, Lagos",
      serviceAreas: ["Ikeja", "Maryland", "Ojota"],
      businessHoursOpen: "08:00",
      businessHoursClose: "20:00",
      homeDeliveryFee: 1000,
      urgentSurchargeAmount: 500,
      urgentSurchargeMode: PricingMode.FLAT,
      abandonedFlagDays: 7,
      moveToStorageDays: 14,
      maxDiscountPercent: 10,
      active: true,
    },
  });
  console.log(`  Branch: ${branch.name} (${branch.code})`);

  // ─── Admin user ────────────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "abkon350@gmail.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Password@123";
  const adminPhone = process.env.SEED_ADMIN_PHONE ?? "+2349012174094";
  const adminHash = await hash(adminPassword, ARGON_OPTIONS);

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Abkon Admin",
      phone: adminPhone,
      passwordHash: adminHash,
      role: Role.ADMIN,
      active: true,
    },
    create: {
      name: "Abkon Admin",
      email: adminEmail,
      phone: adminPhone,
      role: Role.ADMIN,
      passwordHash: adminHash,
      active: true,
    },
  });
  console.log(`  Admin: ${admin.email} (password: ${adminPassword})`);

  // ─── Reception user ────────────────────────────────────────────────────
  const recEmail = process.env.SEED_RECEPTION_EMAIL ?? "tombenjamin7447@gmail.com";
  const recPassword = process.env.SEED_RECEPTION_PASSWORD ?? "Password";
  const recPhone = process.env.SEED_RECEPTION_PHONE ?? "+249155674236";
  const recHash = await hash(recPassword, ARGON_OPTIONS);

  const reception = await db.user.upsert({
    where: { email: recEmail },
    update: {
      name: "Tom Benjamin",
      phone: recPhone,
      passwordHash: recHash,
      role: Role.RECEPTION,
      branchId: branch.id,
      active: true,
    },
    create: {
      name: "Tom Benjamin",
      email: recEmail,
      phone: recPhone,
      role: Role.RECEPTION,
      branchId: branch.id,
      passwordHash: recHash,
      active: true,
    },
  });
  console.log(`  Reception: ${reception.email} (password: ${recPassword})`);

  // ─── Items ─────────────────────────────────────────────────────────────
  const items: Array<{
    name: string;
    unit: ItemUnit;
    washPrice: number | null;
    ironPrice: number | null;
    washAndIronPrice: number | null;
    dryCleanPrice: number | null;
  }> = [
    // Wash + Iron price left null → auto-derived from wash + iron. Set explicitly to offer a combo deal.
    { name: "Shirt", unit: ItemUnit.PIECE, washPrice: 300, ironPrice: 300, washAndIronPrice: null, dryCleanPrice: 800 },
    { name: "T-shirt", unit: ItemUnit.PIECE, washPrice: 300, ironPrice: 200, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Plain trouser", unit: ItemUnit.PIECE, washPrice: 300, ironPrice: 300, washAndIronPrice: null, dryCleanPrice: 700 },
    { name: "Jeans", unit: ItemUnit.PIECE, washPrice: 500, ironPrice: 100, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Skirt", unit: ItemUnit.PIECE, washPrice: 300, ironPrice: 200, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Blouse", unit: ItemUnit.PIECE, washPrice: 300, ironPrice: 200, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Shorts", unit: ItemUnit.PIECE, washPrice: 200, ironPrice: 200, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Ankara up/down", unit: ItemUnit.PIECE, washPrice: 400, ironPrice: 500, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Complete agbada", unit: ItemUnit.PIECE, washPrice: 700, ironPrice: 800, washAndIronPrice: null, dryCleanPrice: 1500 },
    { name: "Senator wear", unit: ItemUnit.PIECE, washPrice: 500, ironPrice: 500, washAndIronPrice: null, dryCleanPrice: 1200 },
    { name: "Underwear", unit: ItemUnit.PIECE, washPrice: 300, ironPrice: 100, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Complete suit", unit: ItemUnit.PIECE, washPrice: 800, ironPrice: 700, washAndIronPrice: null, dryCleanPrice: 2000 },
    { name: "Gown", unit: ItemUnit.PIECE, washPrice: 400, ironPrice: 300, washAndIronPrice: null, dryCleanPrice: 1000 },
    { name: "Kiddies wear", unit: ItemUnit.PIECE, washPrice: 200, ironPrice: 100, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Duvet", unit: ItemUnit.PIECE, washPrice: 2500, ironPrice: null, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Bedspread", unit: ItemUnit.PIECE, washPrice: 1500, ironPrice: null, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Cardigan", unit: ItemUnit.PIECE, washPrice: 500, ironPrice: null, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Curtain", unit: ItemUnit.PIECE, washPrice: 500, ironPrice: null, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Towel", unit: ItemUnit.PIECE, washPrice: 1000, ironPrice: null, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Face cap", unit: ItemUnit.PIECE, washPrice: 300, ironPrice: null, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Wrapper", unit: ItemUnit.PIECE, washPrice: 500, ironPrice: 100, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Pleated skirt", unit: ItemUnit.PIECE, washPrice: 300, ironPrice: 800, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Rug", unit: ItemUnit.SQM, washPrice: 800, ironPrice: null, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Foot mat", unit: ItemUnit.PIECE, washPrice: 1000, ironPrice: null, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Pillow", unit: ItemUnit.NEGOTIABLE, washPrice: null, ironPrice: null, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Teddy", unit: ItemUnit.NEGOTIABLE, washPrice: null, ironPrice: null, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Shoes", unit: ItemUnit.NEGOTIABLE, washPrice: null, ironPrice: null, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Bags", unit: ItemUnit.NEGOTIABLE, washPrice: null, ironPrice: null, washAndIronPrice: null, dryCleanPrice: null },
    { name: "Sofa", unit: ItemUnit.NEGOTIABLE, washPrice: null, ironPrice: null, washAndIronPrice: null, dryCleanPrice: null },
  ];

  for (const [idx, it] of items.entries()) {
    await db.itemType.upsert({
      where: { branchId_name: { branchId: branch.id, name: it.name } },
      update: {},
      create: { ...it, branchId: branch.id, displayOrder: idx, updatedById: admin.id },
    });
  }
  console.log(`  Items: ${items.length}`);

  // ─── Add-ons ───────────────────────────────────────────────────────────
  type Seed = {
    name: string;
    category: string;
    scope: AddOnScope;
    pricingMode: PricingMode;
    amount: number;
    appliesToServices?: Service[];
  };
  const perItem: Seed[] = [
    { name: "Starching", category: "care", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 200, appliesToServices: [Service.WASH, Service.IRON] },
    { name: "Stain removal", category: "care", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 300 },
    { name: "Whitening", category: "care", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 250, appliesToServices: [Service.WASH] },
    { name: "Color restoration", category: "care", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 300, appliesToServices: [Service.WASH] },
    { name: "Fabric softening", category: "care", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 100, appliesToServices: [Service.WASH] },
    { name: "Sanitizing", category: "care", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 200 },
    { name: "Perfuming", category: "care", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 100 },
    { name: "Button replacement", category: "repair", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 200 },
    { name: "Minor stitching", category: "repair", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 300 },
    { name: "Hem adjustment", category: "repair", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 500 },
  ];

  const perTicket: Seed[] = [
    { name: "Same-day rush", category: "urgency", scope: AddOnScope.PER_TICKET, pricingMode: PricingMode.FLAT, amount: 1500 },
    { name: "Premium garment bag", category: "logistics", scope: AddOnScope.PER_TICKET, pricingMode: PricingMode.FLAT, amount: 500 },
  ];

  for (const a of [...perItem, ...perTicket]) {
    await db.addOn.upsert({
      where: { branchId_name: { branchId: branch.id, name: a.name } },
      update: { category: a.category },
      create: {
        branchId: branch.id,
        name: a.name,
        category: a.category,
        scope: a.scope,
        pricingMode: a.pricingMode,
        amount: a.amount,
        appliesToServices: a.appliesToServices ?? [],
        active: true,
        updatedById: admin.id,
      },
    });
  }
  console.log(`  Add-ons: ${perItem.length + perTicket.length}`);

  // ─── Sample tickets (UI fixtures) ─────────────────────────────────────
  // Five tickets covering every interesting tag combination so the listing /
  // detail UI can be exercised without manually creating data.
  const sampleCustomers: Array<{ name: string; phone: string }> = [
    { name: "Adaeze Okafor", phone: "+2348012345001" },
    { name: "Tunde Bakare", phone: "+2348012345002" },
    { name: "Ngozi Eze", phone: "+2348012345003" },
    { name: "Chinedu Obi", phone: "+2348012345004" },
    { name: "Folake Adesanya", phone: "+2348012345005" },
  ];

  const customers = await Promise.all(
    sampleCustomers.map((c) =>
      db.customer.upsert({
        where: { branchId_phone: { branchId: branch.id, phone: c.phone } },
        update: {},
        create: { ...c, branchId: branch.id },
      })
    )
  );

  // Pull a couple of items we can reference deterministically.
  const shirt = await db.itemType.findUnique({
    where: { branchId_name: { branchId: branch.id, name: "Shirt" } },
  });
  const jeans = await db.itemType.findUnique({
    where: { branchId_name: { branchId: branch.id, name: "Jeans" } },
  });
  const duvet = await db.itemType.findUnique({
    where: { branchId_name: { branchId: branch.id, name: "Duvet" } },
  });
  const suit = await db.itemType.findUnique({
    where: { branchId_name: { branchId: branch.id, name: "Complete suit" } },
  });
  const gown = await db.itemType.findUnique({
    where: { branchId_name: { branchId: branch.id, name: "Gown" } },
  });

  const now = new Date();
  function daysAgo(d: number): Date {
    const x = new Date(now);
    x.setDate(x.getDate() - d);
    return x;
  }
  function daysAhead(d: number): Date {
    const x = new Date(now);
    x.setDate(x.getDate() + d);
    return x;
  }

  // Stable seed-only ticket-number generator; uses YYYY-W00 bucket.
  function isoWeekBucket(d: Date): string {
    const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = x.getUTCDay() || 7;
    x.setUTCDate(x.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil(((x.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
    return `${x.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
  }
  const bucket = isoWeekBucket(now);

  type SampleTicket = {
    customer: typeof customers[number];
    status: TicketStatus;
    payment: PaymentStatus;
    urgent: boolean;
    receivedAt: Date;
    pickupDatePromised: Date;
    readyAt: Date | null;
    inStorageAt: Date | null;
    collectedAt: Date | null;
    cancelledAt: Date | null;
    paidAt: Date | null;
    cancellationReason: string | null;
    items: Array<{
      itemType: { id: string; name: string } | null;
      service: Service;
      quantity: number;
      unitPrice: number;
    }>;
    ticketRandom: number;
  };

  const samples: SampleTicket[] = [
    // 1) Urgent, just received, unpaid — sky + red tags
    {
      customer: customers[0]!,
      status: TicketStatus.RECEIVED,
      payment: PaymentStatus.UNPAID,
      urgent: true,
      receivedAt: now,
      pickupDatePromised: daysAhead(1),
      readyAt: null,
      inStorageAt: null,
      collectedAt: null,
      cancelledAt: null,
      paidAt: null,
      cancellationReason: null,
      items: shirt && jeans
        ? [
            { itemType: shirt, service: Service.WASH_AND_IRON, quantity: 4, unitPrice: 550 },
            { itemType: jeans, service: Service.WASH, quantity: 2, unitPrice: 500 },
          ]
        : [],
      ticketRandom: 100001,
    },
    // 2) Ready, paid — green
    {
      customer: customers[1]!,
      status: TicketStatus.READY,
      payment: PaymentStatus.PAID,
      urgent: false,
      receivedAt: daysAgo(2),
      pickupDatePromised: daysAhead(0),
      readyAt: daysAgo(0),
      inStorageAt: null,
      collectedAt: null,
      cancelledAt: null,
      paidAt: daysAgo(0),
      cancellationReason: null,
      items: suit
        ? [{ itemType: suit, service: Service.DRY_CLEAN, quantity: 1, unitPrice: 2000 }]
        : [],
      ticketRandom: 100002,
    },
    // 3) In storage, unpaid — amber, abandoned-leaning
    {
      customer: customers[2]!,
      status: TicketStatus.IN_STORAGE,
      payment: PaymentStatus.UNPAID,
      urgent: false,
      receivedAt: daysAgo(20),
      pickupDatePromised: daysAgo(15),
      readyAt: daysAgo(18),
      inStorageAt: daysAgo(6),
      collectedAt: null,
      cancelledAt: null,
      paidAt: null,
      cancellationReason: null,
      items: duvet
        ? [{ itemType: duvet, service: Service.WASH, quantity: 1, unitPrice: 2500 }]
        : [],
      ticketRandom: 100003,
    },
    // 4) Collected, paid — closed happy path
    {
      customer: customers[3]!,
      status: TicketStatus.COLLECTED,
      payment: PaymentStatus.PAID,
      urgent: false,
      receivedAt: daysAgo(5),
      pickupDatePromised: daysAgo(3),
      readyAt: daysAgo(4),
      inStorageAt: null,
      collectedAt: daysAgo(2),
      cancelledAt: null,
      paidAt: daysAgo(2),
      cancellationReason: null,
      items: gown && shirt
        ? [
            { itemType: gown, service: Service.WASH_AND_IRON, quantity: 1, unitPrice: 700 },
            { itemType: shirt, service: Service.IRON, quantity: 3, unitPrice: 300 },
          ]
        : [],
      ticketRandom: 100004,
    },
    // 5) Cancelled — red badge
    {
      customer: customers[4]!,
      status: TicketStatus.CANCELLED,
      payment: PaymentStatus.UNPAID,
      urgent: false,
      receivedAt: daysAgo(1),
      pickupDatePromised: daysAhead(2),
      readyAt: null,
      inStorageAt: null,
      collectedAt: null,
      cancelledAt: daysAgo(0),
      paidAt: null,
      cancellationReason: "Customer changed mind",
      items: shirt
        ? [{ itemType: shirt, service: Service.WASH, quantity: 2, unitPrice: 300 }]
        : [],
      ticketRandom: 100005,
    },
  ];

  for (const s of samples) {
    const lineSubtotals = s.items.map((it) => it.quantity * it.unitPrice);
    const lineItemsSubtotal = lineSubtotals.reduce((a, b) => a + b, 0);
    const grandTotal = lineItemsSubtotal;
    const ticketNumber = `AB-${branch.code}-${String(s.ticketRandom).padStart(6, "0")}-KON`;

    const existing = await db.ticket.findUnique({ where: { ticketNumber } });
    if (existing) continue;

    await db.ticket.create({
      data: {
        ticketNumber,
        ticketBucket: bucket,
        ticketRandom: s.ticketRandom,
        branchId: branch.id,
        customerId: s.customer.id,
        createdById: admin.id,
        source: TicketSource.WALK_IN,
        status: s.status,
        receivedAt: s.receivedAt,
        readyAt: s.readyAt,
        inStorageAt: s.inStorageAt,
        collectedAt: s.collectedAt,
        cancelledAt: s.cancelledAt,
        cancellationReason: s.cancellationReason,
        pickupDatePromised: s.pickupDatePromised,
        isUrgent: s.urgent,
        lineItemsSubtotal,
        perTicketAddonsTotal: 0,
        discountPercent: 0,
        discountAmount: 0,
        grandTotal,
        paymentStatus: s.payment,
        paidAt: s.paidAt,
        paidToId: s.paidAt ? admin.id : null,
        lineItems: {
          create: s.items.map((it) => ({
            itemTypeId: it.itemType?.id ?? null,
            itemTypeNameSnapshot: it.itemType?.name ?? "Custom",
            service: it.service,
            quantity: it.quantity,
            unit: ItemUnit.PIECE,
            unitPriceSnapshot: it.unitPrice,
            isNegotiable: false,
            lineSubtotal: it.quantity * it.unitPrice,
          })),
        },
      },
    });
  }
  console.log(`  Sample tickets: ${samples.length}`);

  console.log("✅ Seed complete.\n");
  console.log("Sign in at /login with:");
  console.log(`  Admin    → ${adminEmail} / ${adminPassword}`);
  console.log(`  Reception → ${recEmail} / ${recPassword}\n`);
  console.log("⚠️  Change these passwords before going to production.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
