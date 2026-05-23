/**
 * One-shot: replace the live DB's seeded admin + reception accounts with the
 * real credentials. Also reassigns any customer that happened to share the new
 * reception phone (the user's personal number was used for a test customer).
 *
 * Run once:  npx tsx scripts/replace-accounts.ts
 * Then delete this file (or keep for re-use).
 */
import { hash } from "@node-rs/argon2";
import { PrismaClient, Role } from "@prisma/client";

const db = new PrismaClient();

const ARGON_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

const NEW_ADMIN = {
  name: "Abkon Admin",
  email: "abkon350@gmail.com",
  phone: "+2349012174094",
  password: "Password@123",
};

const NEW_RECEPTION = {
  name: "Tom Benjamin",
  email: "tombenjamin7447@gmail.com",
  phone: "+249155674236",
  password: "Password",
};

async function main() {
  console.log("Replacing admin + reception accounts...\n");

  // ── Customer reassignment ─────────────────────────────────────────────
  // If a customer was created using the new reception phone for testing,
  // move them to a placeholder so the unique branch+phone constraint
  // doesn't block reception updates.
  const conflictingCustomer = await db.customer.findFirst({
    where: { phone: { in: [NEW_RECEPTION.phone, NEW_RECEPTION.phone.replace(/[^\d]/g, "")] } },
  });
  if (conflictingCustomer) {
    const placeholder = `+2348012345${String(Date.now()).slice(-3)}`;
    await db.customer.update({
      where: { id: conflictingCustomer.id },
      data: { phone: placeholder, notes: `Original phone moved to staff. Was: ${conflictingCustomer.phone}` },
    });
    console.log(
      `  Customer ${conflictingCustomer.name} (${conflictingCustomer.phone}) → ${placeholder}`
    );
  }

  // ── Admin ─────────────────────────────────────────────────────────────
  const adminHash = await hash(NEW_ADMIN.password, ARGON_OPTIONS);
  const existingAdmin = await db.user.findFirst({ where: { role: Role.ADMIN } });

  if (existingAdmin) {
    // Detach the old admin email from any unique-collision if the new email
    // is already taken by a separate row first.
    const newEmailHolder = await db.user.findUnique({
      where: { email: NEW_ADMIN.email },
    });
    if (newEmailHolder && newEmailHolder.id !== existingAdmin.id) {
      await db.user.delete({ where: { id: newEmailHolder.id } });
      console.log(`  Removed stale row with email ${NEW_ADMIN.email}`);
    }
    await db.user.update({
      where: { id: existingAdmin.id },
      data: {
        name: NEW_ADMIN.name,
        email: NEW_ADMIN.email,
        phone: NEW_ADMIN.phone,
        passwordHash: adminHash,
        active: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    console.log(`  Admin updated: ${NEW_ADMIN.email}`);
  } else {
    await db.user.create({
      data: {
        name: NEW_ADMIN.name,
        email: NEW_ADMIN.email,
        phone: NEW_ADMIN.phone,
        role: Role.ADMIN,
        passwordHash: adminHash,
        active: true,
      },
    });
    console.log(`  Admin created: ${NEW_ADMIN.email}`);
  }

  // ── Reception ─────────────────────────────────────────────────────────
  const recHash = await hash(NEW_RECEPTION.password, ARGON_OPTIONS);
  const existingReception = await db.user.findFirst({ where: { role: Role.RECEPTION } });
  const branch = await db.branch.findFirst({ orderBy: { name: "asc" } });
  if (!branch) throw new Error("No branch found — seed the branch first.");

  if (existingReception) {
    const newEmailHolder = await db.user.findUnique({
      where: { email: NEW_RECEPTION.email },
    });
    if (newEmailHolder && newEmailHolder.id !== existingReception.id) {
      await db.user.delete({ where: { id: newEmailHolder.id } });
      console.log(`  Removed stale row with email ${NEW_RECEPTION.email}`);
    }
    await db.user.update({
      where: { id: existingReception.id },
      data: {
        name: NEW_RECEPTION.name,
        email: NEW_RECEPTION.email,
        phone: NEW_RECEPTION.phone,
        passwordHash: recHash,
        branchId: branch.id,
        active: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    console.log(`  Reception updated: ${NEW_RECEPTION.email}`);
  } else {
    await db.user.create({
      data: {
        name: NEW_RECEPTION.name,
        email: NEW_RECEPTION.email,
        phone: NEW_RECEPTION.phone,
        role: Role.RECEPTION,
        branchId: branch.id,
        passwordHash: recHash,
        active: true,
      },
    });
    console.log(`  Reception created: ${NEW_RECEPTION.email}`);
  }

  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
