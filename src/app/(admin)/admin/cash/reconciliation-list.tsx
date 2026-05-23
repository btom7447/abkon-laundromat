import { formatDate, formatDbDate, formatNaira } from "@/lib/utils";

export type ReconciliationRow = {
  id: string;
  date: Date;
  expectedCash: number;
  countedCash: number;
  discrepancy: number;
  notes: string | null;
  reconciledBy: string;
  reconciledAt: Date;
};

interface Props {
  rows: ReconciliationRow[];
}

function VarianceBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
        Balanced
      </span>
    );
  }
  if (value > 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
        +{formatNaira(value)} over
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200">
      {formatNaira(value)} short
    </span>
  );
}

export function ReconciliationList({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <p className="py-2 text-center text-sm text-muted-foreground">
        No reconciliations recorded yet. Cash you save today will appear here.
      </p>
    );
  }

  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {rows.slice(0, 30).map((r) => (
          <article
            key={r.id}
            className="flex flex-col gap-2 rounded-xl border border-default bg-card p-3.5 shadow-[0_1px_2px_0_rgb(15_23_42/0.04)]"
          >
            <header className="flex items-center justify-between gap-2">
              <span className="text-[13.5px] font-semibold text-foreground">
                {formatDbDate(r.date)}
              </span>
              <VarianceBadge value={r.discrepancy} />
            </header>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-dashed border-default pt-2 text-[12.5px]">
              <dt className="text-muted-foreground">Expected</dt>
              <dd className="text-right font-semibold tabular-nums text-foreground">
                {formatNaira(r.expectedCash)}
              </dd>
              <dt className="text-muted-foreground">Counted</dt>
              <dd className="text-right font-semibold tabular-nums text-foreground">
                {formatNaira(r.countedCash)}
              </dd>
            </dl>
            <footer className="flex items-center justify-between gap-2 border-t border-dashed border-default pt-2 text-[11.5px] text-muted-foreground">
              <span>By {r.reconciledBy}</span>
              <span>{formatDate(r.reconciledAt)}</span>
            </footer>
            {r.notes && (
              <p className="rounded-md border border-dashed border-default bg-surface-muted/40 px-2.5 py-1.5 text-[12px] italic text-muted-foreground">
                {r.notes}
              </p>
            )}
          </article>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-default">
            <tr>
              <Th>Date</Th>
              <Th>Expected</Th>
              <Th>Counted</Th>
              <Th>Variance</Th>
              <Th>Reconciled by</Th>
              <Th>Saved</Th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 30).map((r) => (
              <tr key={r.id} className="border-b border-default last:border-0">
                <td className="px-3 py-2.5 font-medium text-foreground">{formatDbDate(r.date)}</td>
                <td className="px-3 py-2.5 tabular-nums">{formatNaira(r.expectedCash)}</td>
                <td className="px-3 py-2.5 tabular-nums">{formatNaira(r.countedCash)}</td>
                <td className="px-3 py-2.5">
                  <VarianceBadge value={r.discrepancy} />
                  {r.notes && (
                    <div className="mt-1 max-w-xs truncate text-xs italic text-muted-foreground">
                      {r.notes}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2.5 text-sm">{r.reconciledBy}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {formatDate(r.reconciledAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
      {children}
    </th>
  );
}
