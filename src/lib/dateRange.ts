// src/lib/dateRange.ts

export type RangePreset = "today" | "week" | "month" | "custom";

export const toYMD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const startOfDay = (d: Date): Date => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const endOfDay = (d: Date): Date => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

// Monday-start week
export const startOfWeek = (d: Date): Date => {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
};

export const startOfMonth = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth(), 1);

export const endOfMonth = (d: Date): Date =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

export const rangeForPreset = (
  preset: Exclude<RangePreset, "custom">,
  now: Date = new Date()
): { from: Date; to: Date } => {
  if (preset === "today") {
    return { from: startOfDay(now), to: endOfDay(now) };
  }
  if (preset === "week") {
    return { from: startOfWeek(now), to: endOfDay(now) };
  }
  // month
  return { from: startOfMonth(now), to: endOfDay(now) };
};

export const formatRangeLabel = (from: Date, to: Date): string => {
  const opts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
  const f = from.toLocaleDateString("en-IN", opts);
  const t = to.toLocaleDateString("en-IN", opts);
  return f === t ? f : `${f} - ${t}`;
};