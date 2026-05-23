"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/rbac";

/**
 * Mark a single derived notification as read for the signed-in user.
 * Idempotent — uses unique (userId, notificationId).
 */
export async function markNotificationReadAction(notificationId: string): Promise<void> {
  if (!notificationId) return;
  const actor = await requireSession();

  await db.notificationRead.upsert({
    where: {
      userId_notificationId: { userId: actor.id, notificationId },
    },
    update: {},
    create: { userId: actor.id, notificationId },
  });

  revalidatePath("/admin");
}

/**
 * Mark every provided notification id as read in one round-trip.
 * Used by the "Mark all as read" button.
 */
export async function markAllNotificationsReadAction(notificationIds: string[]): Promise<void> {
  const actor = await requireSession();
  const ids = (notificationIds ?? []).filter(Boolean);
  if (ids.length === 0) return;

  await db.notificationRead.createMany({
    data: ids.map((notificationId) => ({ userId: actor.id, notificationId })),
    skipDuplicates: true,
  });

  revalidatePath("/admin");
}
