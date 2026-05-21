import { PrismaClient, Role, ItemUnit, AddOnScope, PricingMode, Service } from "@prisma/client";
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
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@abkon.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminHash = await hash(adminPassword, ARGON_OPTIONS);

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Abkon Admin",
      email: adminEmail,
      role: Role.ADMIN,
      passwordHash: adminHash,
      active: true,
    },
  });
  console.log(`  Admin: ${admin.email} (password: ${adminPassword})`);

  // ─── Reception user ────────────────────────────────────────────────────
  const recEmail = process.env.SEED_RECEPTION_EMAIL ?? "reception@abkon.local";
  const recPassword = process.env.SEED_RECEPTION_PASSWORD ?? "Reception123!";
  const recHash = await hash(recPassword, ARGON_OPTIONS);

  const reception = await db.user.upsert({
    where: { email: recEmail },
    update: {},
    create: {
      name: "Reception Staff",
      email: recEmail,
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
    dryCleanPrice: number | null;
  }> = [
    { name: "Shirt", unit: ItemUnit.PIECE, washPrice: 300, ironPrice: 300, dryCleanPrice: 800 },
    { name: "T-shirt", unit: ItemUnit.PIECE, washPrice: 300, ironPrice: 200, dryCleanPrice: null },
    { name: "Plain trouser", unit: ItemUnit.PIECE, washPrice: 300, ironPrice: 300, dryCleanPrice: 700 },
    { name: "Jeans", unit: ItemUnit.PIECE, washPrice: 500, ironPrice: 100, dryCleanPrice: null },
    { name: "Skirt", unit: ItemUnit.PIECE, washPrice: 300, ironPrice: 200, dryCleanPrice: null },
    { name: "Blouse", unit: ItemUnit.PIECE, washPrice: 300, ironPrice: 200, dryCleanPrice: null },
    { name: "Shorts", unit: ItemUnit.PIECE, washPrice: 200, ironPrice: 200, dryCleanPrice: null },
    { name: "Ankara up/down", unit: ItemUnit.PIECE, washPrice: 400, ironPrice: 500, dryCleanPrice: null },
    { name: "Complete agbada", unit: ItemUnit.PIECE, washPrice: 700, ironPrice: 800, dryCleanPrice: 1500 },
    { name: "Senator wear", unit: ItemUnit.PIECE, washPrice: 500, ironPrice: 500, dryCleanPrice: 1200 },
    { name: "Underwear", unit: ItemUnit.PIECE, washPrice: 300, ironPrice: 100, dryCleanPrice: null },
    { name: "Complete suit", unit: ItemUnit.PIECE, washPrice: 800, ironPrice: 700, dryCleanPrice: 2000 },
    { name: "Gown", unit: ItemUnit.PIECE, washPrice: 400, ironPrice: 300, dryCleanPrice: 1000 },
    { name: "Kiddies wear", unit: ItemUnit.PIECE, washPrice: 200, ironPrice: 100, dryCleanPrice: null },
    { name: "Duvet", unit: ItemUnit.PIECE, washPrice: 2500, ironPrice: null, dryCleanPrice: null },
    { name: "Bedspread", unit: ItemUnit.PIECE, washPrice: 1500, ironPrice: null, dryCleanPrice: null },
    { name: "Cardigan", unit: ItemUnit.PIECE, washPrice: 500, ironPrice: null, dryCleanPrice: null },
    { name: "Curtain", unit: ItemUnit.PIECE, washPrice: 500, ironPrice: null, dryCleanPrice: null },
    { name: "Towel", unit: ItemUnit.PIECE, washPrice: 1000, ironPrice: null, dryCleanPrice: null },
    { name: "Face cap", unit: ItemUnit.PIECE, washPrice: 300, ironPrice: null, dryCleanPrice: null },
    { name: "Wrapper", unit: ItemUnit.PIECE, washPrice: 500, ironPrice: 100, dryCleanPrice: null },
    { name: "Pleated skirt", unit: ItemUnit.PIECE, washPrice: 300, ironPrice: 800, dryCleanPrice: null },
    { name: "Rug", unit: ItemUnit.SQM, washPrice: 800, ironPrice: null, dryCleanPrice: null },
    { name: "Foot mat", unit: ItemUnit.PIECE, washPrice: 1000, ironPrice: null, dryCleanPrice: null },
    { name: "Pillow / teddy", unit: ItemUnit.NEGOTIABLE, washPrice: null, ironPrice: null, dryCleanPrice: null },
    { name: "Shoes / bags", unit: ItemUnit.NEGOTIABLE, washPrice: null, ironPrice: null, dryCleanPrice: null },
    { name: "Sofa", unit: ItemUnit.NEGOTIABLE, washPrice: null, ironPrice: null, dryCleanPrice: null },
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
    scope: AddOnScope;
    pricingMode: PricingMode;
    amount: number;
    appliesToServices?: Service[];
  };
  const perItem: Seed[] = [
    { name: "Starching", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 200, appliesToServices: [Service.WASH, Service.IRON] },
    { name: "Stain removal", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 300 },
    { name: "Whitening", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 250, appliesToServices: [Service.WASH] },
    { name: "Color restoration", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 300, appliesToServices: [Service.WASH] },
    { name: "Fabric softening", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 100, appliesToServices: [Service.WASH] },
    { name: "Sanitizing", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 200 },
    { name: "Perfuming", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 100 },
    { name: "Button replacement", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 200 },
    { name: "Minor stitching", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 300 },
    { name: "Hem adjustment", scope: AddOnScope.PER_ITEM, pricingMode: PricingMode.FLAT, amount: 500 },
  ];

  const perTicket: Seed[] = [
    { name: "Same-day rush", scope: AddOnScope.PER_TICKET, pricingMode: PricingMode.FLAT, amount: 1500 },
    { name: "Premium garment bag", scope: AddOnScope.PER_TICKET, pricingMode: PricingMode.FLAT, amount: 500 },
  ];

  for (const a of [...perItem, ...perTicket]) {
    await db.addOn.upsert({
      where: { branchId_name: { branchId: branch.id, name: a.name } },
      update: {},
      create: {
        branchId: branch.id,
        name: a.name,
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
