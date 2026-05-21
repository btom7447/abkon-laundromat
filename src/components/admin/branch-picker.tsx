"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select } from "@/components/ui/select";

interface BranchPickerProps {
  branches: { id: string; name: string; code: string }[];
  current: string | null;
}

export function BranchPicker({ branches, current }: BranchPickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (branches.length === 0) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        No branches yet — create one first.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-500">Branch:</span>
      <Select
        className="h-9 w-auto"
        value={current ?? branches[0]?.id}
        onChange={(e) => {
          const next = new URLSearchParams(searchParams.toString());
          next.set("branch", e.target.value);
          router.replace(`${pathname}?${next.toString()}`);
        }}
      >
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name} ({b.code})
          </option>
        ))}
      </Select>
    </div>
  );
}
