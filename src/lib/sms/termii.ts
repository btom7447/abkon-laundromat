import { env } from "@/lib/env";

export type TermiiResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

/**
 * Send a plain SMS via Termii.
 *
 * If TERMII_API_KEY is empty, returns ok=true with a synthetic id and logs
 * to console. This lets the rest of the app (and seed/dev) work without
 * provisioning Termii first.
 *
 * Docs: https://developers.termii.com/messaging-api
 */
export async function sendTermiiSms(opts: {
  to: string;
  message: string;
}): Promise<TermiiResult> {
  const { to, message } = opts;

  if (!env.TERMII_API_KEY) {
    console.log(`[sms:stub] would send to ${to}: ${message}`);
    return { ok: true, messageId: `stub_${Date.now()}` };
  }

  try {
    const res = await fetch(`${env.TERMII_BASE_URL}/api/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: normalizePhone(to),
        from: env.TERMII_SENDER_ID,
        sms: message,
        type: "plain",
        channel: "generic",
        api_key: env.TERMII_API_KEY,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      message_id?: string;
      message?: string;
      code?: string;
    };

    if (!res.ok || !data.message_id) {
      return { ok: false, error: data.message ?? `Termii responded ${res.status}` };
    }

    return { ok: true, messageId: data.message_id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown SMS error" };
  }
}

/** Normalize Nigerian phone to international format (e.g. +234…). */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}
