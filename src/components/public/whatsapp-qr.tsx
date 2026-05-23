"use client";

import { QRCodeSVG } from "qrcode.react";

interface WhatsAppQRProps {
  phoneNumber: string;
  message?: string;
  size?: number;
  /** Compact mode: render only the QR card, no "Open WhatsApp" button. */
  compact?: boolean;
}

export function WhatsAppQR({
  phoneNumber,
  message,
  size = 180,
  compact = false,
}: WhatsAppQRProps) {
  const cleanedPhone = phoneNumber.replace(/[^\d]/g, "");
  const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : "";
  const url = `https://wa.me/${cleanedPhone}${encodedMessage}`;

  if (compact) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
        <QRCodeSVG value={url} size={size} level="M" includeMargin={false} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <QRCodeSVG value={url} size={size} level="M" includeMargin={false} />
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Open WhatsApp
      </a>
    </div>
  );
}
