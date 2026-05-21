"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Archive, PackageCheck, XCircle, Loader2, CreditCard } from "lucide-react";
import type { TicketStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { transitionTicketStatus, markTicketPaid } from "@/server/actions/tickets";

interface Props {
  ticketId: string;
  currentStatus: TicketStatus;
  paymentStatus: "PAID" | "UNPAID";
}

export function StatusActions({ ticketId, currentStatus, paymentStatus }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);

  function transition(next: TicketStatus, reason?: string) {
    setError(null);
    startTransition(async () => {
      const res = await transitionTicketStatus({ ticketId, nextStatus: next, reason });
      if (!res.ok) setError(res.error ?? "Failed to update status.");
      else router.refresh();
    });
  }

  function pay() {
    setError(null);
    startTransition(async () => {
      const res = await markTicketPaid(ticketId);
      if (!res.ok) setError(res.error ?? "Failed to mark paid.");
      else router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="flex flex-wrap gap-2">
        {currentStatus === "RECEIVED" && (
          <>
            <Button disabled={pending} onClick={() => transition("READY")}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Mark ready
            </Button>
            <Button variant="outline" disabled={pending} onClick={() => setShowCancel(true)}>
              <XCircle className="h-4 w-4" />
              Cancel ticket
            </Button>
          </>
        )}

        {currentStatus === "READY" && (
          <>
            <Button disabled={pending} onClick={() => transition("COLLECTED")}>
              <PackageCheck className="h-4 w-4" />
              Mark collected
            </Button>
            <Button variant="outline" disabled={pending} onClick={() => transition("IN_STORAGE")}>
              <Archive className="h-4 w-4" />
              Move to storage
            </Button>
          </>
        )}

        {currentStatus === "IN_STORAGE" && (
          <Button disabled={pending} onClick={() => transition("COLLECTED")}>
            <PackageCheck className="h-4 w-4" />
            Mark collected
          </Button>
        )}

        {paymentStatus === "UNPAID" && currentStatus !== "CANCELLED" && (
          <Button variant="outline" disabled={pending} onClick={pay}>
            <CreditCard className="h-4 w-4" />
            Mark paid
          </Button>
        )}
      </div>

      {showCancel && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
          <div className="text-sm font-medium text-red-900">Cancel ticket?</div>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason (required)"
            rows={2}
            className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          />
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              disabled={pending || !cancelReason.trim()}
              onClick={() => transition("CANCELLED", cancelReason.trim())}
            >
              Confirm cancellation
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowCancel(false); setCancelReason(""); }}>
              Keep ticket
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
