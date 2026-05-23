"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";

export function ReportDownloadButton() {
  return (
    <button
      type="button"
      onClick={() =>
        toast.info("Download coming soon", {
          description: "CSV + PDF export is in progress — we'll ship it in a future release.",
        })
      }
      className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-3.5 text-[13.5px] font-medium leading-none text-white transition-colors hover:bg-brand-600 [&_svg]:h-3.5 [&_svg]:w-3.5"
    >
      <Download />
      Download report
    </button>
  );
}
