"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession, assertCanAccessBranch } from "@/lib/rbac";
import { queueAndSendSms } from "@/lib/sms/send";
import { recordAudit } from "@/lib/audit";

/**
 * Re-fire an SMS using the original log's phone, content, and message type.
 * Creates a brand-new SmsLog entry — the original log is preserved so the
 * history shows both attempts.
 */
export async function resendSms(
  input: { smsLogId: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await requireSession();

  const original = await db.smsLog.findUnique({
    where: { id: input.smsLogId },
    select: {
      id: true,
      ticketId: true,
      customerPhone: true,
      content: true,
      messageType: true,
      ticket: { select: { branchId: true, id: true } },
    },
  });

  if (!original) return { ok: false, error: "SMS log not found." };

  if (original.ticket?.branchId) {
    try {
      assertCanAccessBranch(actor, original.ticket.branchId);
    } catch {
      return { ok: false, error: "You don't have access to this ticket's branch." };
    }
  }

  await queueAndSendSms({
    ticketId: original.ticketId ?? null,
    phone: original.customerPhone,
    message: original.content,
    type: original.messageType,
  });

  await recordAudit({
    actorId: actor.id,
    actorRole: actor.role,
    branchId: original.ticket?.branchId ?? null,
    action: "sms_resent",
    entityType: "smsLog",
    entityId: original.id,
    afterState: { resentFor: original.id, phone: original.customerPhone, type: original.messageType },
  });

  if (original.ticket?.id) {
    revalidatePath(`/admin/tickets/${original.ticket.id}`);
  }

  return { ok: true };
}
