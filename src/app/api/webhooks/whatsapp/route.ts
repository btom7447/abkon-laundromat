import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Meta hits this endpoint twice:
 *   1. GET with hub.mode=subscribe + hub.verify_token + hub.challenge during
 *      webhook setup — we echo hub.challenge back if the token matches.
 *   2. POST with the actual message / status payload (JSON) — we verify the
 *      X-Hub-Signature-256 HMAC against META_APP_SECRET, parse, and dispatch.
 *
 * Docs: https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === env.META_WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? "", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";

  if (!verifySignature(rawBody, signature, env.META_APP_SECRET)) {
    return NextResponse.json({ ok: false, error: "Bad signature" }, { status: 401 });
  }

  let payload: WhatsAppWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WhatsAppWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad JSON" }, { status: 400 });
  }

  // Meta REQUIRES a 200 within a few seconds. Do the heavy work async so the
  // ack returns immediately even if downstream handlers are slow.
  queueMicrotask(() => {
    handleWebhook(payload).catch((err) => {
      console.error("[whatsapp webhook] handler failed", err);
    });
  });

  return NextResponse.json({ ok: true });
}

function verifySignature(rawBody: string, signature: string, appSecret: string): boolean {
  if (!appSecret) return false;
  if (!signature.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const received = signature.slice("sha256=".length);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
  } catch {
    return false;
  }
}

type WhatsAppMessage = {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  interactive?: { type: string; button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string } };
};

type WhatsAppStatus = {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
};

type WhatsAppWebhookPayload = {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      field: string;
      value: {
        messaging_product: "whatsapp";
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: Array<{ wa_id: string; profile?: { name?: string } }>;
        messages?: WhatsAppMessage[];
        statuses?: WhatsAppStatus[];
      };
    }>;
  }>;
};

async function handleWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
  if (payload.object !== "whatsapp_business_account") return;

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value) continue;

      for (const message of value.messages ?? []) {
        // Bot dispatch lands here in the next commit.
        console.log("[whatsapp] incoming message", {
          from: message.from,
          type: message.type,
          text: message.text?.body,
        });
      }

      for (const status of value.statuses ?? []) {
        console.log("[whatsapp] status update", {
          id: status.id,
          status: status.status,
          recipient: status.recipient_id,
        });
      }
    }
  }
}
