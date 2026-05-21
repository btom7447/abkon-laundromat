import { randomInt } from "node:crypto";
import { db } from "@/lib/db";

/**
 * Ticket number format: `AB-{BRANCH_CODE}-{6 random digits}-KON`
 *
 * Uniqueness is enforced per (branchId, ticketBucket) where ticketBucket is
 * the ISO year-week. Each branch has 1,000,000 possible numbers per week,
 * which is comfortably more than any realistic ticket volume.
 *
 * Collisions are extremely unlikely but we retry deterministically.
 */
const MAX_RETRIES = 20;

export function currentTicketBucket(date: Date = new Date()): string {
  // ISO week (Monday as first day, year of the Thursday in that week)
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function randomSixDigits(): number {
  return randomInt(100_000, 1_000_000);
}

export type GeneratedTicketNumber = {
  ticketNumber: string;
  ticketBucket: string;
  ticketRandom: number;
};

/**
 * Generate a ticket number that is unique within (branch, current week).
 * Throws after MAX_RETRIES collisions — extremely unlikely in practice.
 */
export async function generateTicketNumber(
  branchId: string,
  branchCode: string
): Promise<GeneratedTicketNumber> {
  const bucket = currentTicketBucket();

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const candidate = randomSixDigits();
    const clash = await db.ticket.findUnique({
      where: {
        branchId_ticketBucket_ticketRandom: {
          branchId,
          ticketBucket: bucket,
          ticketRandom: candidate,
        },
      },
      select: { id: true },
    });
    if (!clash) {
      return {
        ticketNumber: `AB-${branchCode}-${String(candidate).padStart(6, "0")}-KON`,
        ticketBucket: bucket,
        ticketRandom: candidate,
      };
    }
  }

  throw new Error(
    `Could not generate a unique ticket number for branch ${branchCode} after ${MAX_RETRIES} attempts.`
  );
}
