"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatNaira } from "@/lib/utils";

const BRAND = "#0284c7";
const COLORS = ["#0284c7", "#7c3aed", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#84cc16"];

export function RevenueLineChart({
  data,
}: {
  data: Array<{ date: string; revenue: number; tickets: number }>;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(s) => s.slice(5)} />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
            formatter={(value) => [formatNaira(Number(value)), "Revenue"]}
          />
          <Line type="monotone" dataKey="revenue" stroke={BRAND} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TicketsBarChart({
  data,
}: {
  data: Array<{ date: string; tickets: number }>;
}) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(s) => s.slice(5)} />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
          <Bar dataKey="tickets" fill="#7c3aed" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopItemsBarChart({
  data,
  unit = "currency",
}: {
  data: Array<{ name: string; quantity: number; revenue: number }>;
  unit?: "currency" | "count";
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 30, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickFormatter={(v) => (unit === "currency" ? (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)) : String(v))}
          />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#334155" }} width={130} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
            formatter={(value) => (unit === "currency" ? formatNaira(Number(value)) : String(value))}
          />
          <Bar dataKey={unit === "currency" ? "revenue" : "quantity"} fill={BRAND} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ServiceSplitDonut({
  data,
}: {
  data: Array<{ service: string; count: number; revenue: number }>;
}) {
  const labelMap: Record<string, string> = { WASH: "Wash", IRON: "Iron", DRY_CLEAN: "Dry clean" };
  const formatted = data.map((d) => ({ name: labelMap[d.service] ?? d.service, value: d.count, revenue: d.revenue }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={formatted} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85}>
            {formatted.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
            formatter={(value, _name, item) => {
              const revenue = (item as { payload?: { revenue?: number } } | undefined)?.payload?.revenue ?? 0;
              return [`${Number(value)} items · ${formatNaira(revenue)}`, String(item?.name ?? "")];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
