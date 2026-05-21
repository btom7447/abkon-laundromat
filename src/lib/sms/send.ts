import type { SmsMessageType } from "@prisma/client";
import { db } from "@/lib/db";
import { sendTermiiSms } from "@/lib/sms/termii";

export type QueueSmsInput = {
  ticketId?: string | null;
  phone: string;
  message: string;
  type: SmsMessageType;
};

/**
 * Queue + send an SMS. Records to SmsLog before and after the provider call,
 * so we have a complete audit trail even if the provider fails.
 *
 * Errors are swallowed — SMS failures should never break ticket creation.
 */
export async function queueAndSendSms(input: QueueSmsInput): Promise<void> {
  const log = await db.smsLog.create({
    data: {
      ticketId: input.ticketId ?? null,
      customerPhone: input.phone,
      messageType: input.type,
      content: input.message,
      provider: "termii",
      status: "QUEUED",
    },
  });

  const result = await sendTermiiSms({ to: input.phone, message: input.message });

  if (result.ok) {
    await db.smsLog.update({
      where: { id: log.id },
      data: { status: "SENT", providerMessageId: result.messageId, sentAt: new Date() },
    });
  } else {
    await db.smsLog.update({
      where: { id: log.id },
      data: { status: "FAILED", error: result.error },
    });
    console.error(`[sms] send failed for ${input.phone}: ${result.error}`);
  }
}
