export const POSITIONS = ["GK", "DF", "MF", "FW"] as const;
export type Position = (typeof POSITIONS)[number];

export const POSITION_LABELS: Record<Position, string> = {
  GK: "Thủ môn",
  DF: "Hậu vệ",
  MF: "Tiền vệ",
  FW: "Tiền đạo",
};

export const POSITION_STYLES: Record<Position, string> = {
  GK: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  DF: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  MF: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  FW: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
};

export const WEEKDAYS = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

export const TEAMS = [
  { name: "Đội Đỏ", dot: "bg-red-500", border: "border-red-500" },
  { name: "Đội Xanh", dot: "bg-blue-500", border: "border-blue-500" },
  { name: "Đội Vàng", dot: "bg-yellow-400", border: "border-yellow-400" },
  { name: "Đội Trắng", dot: "bg-zinc-200 ring-1 ring-zinc-400", border: "border-zinc-400" },
];

export const MAX_TEAMS = TEAMS.length;

export function isPosition(v: unknown): v is Position {
  return typeof v === "string" && (POSITIONS as readonly string[]).includes(v);
}

export const TIMEZONE = "Asia/Ho_Chi_Minh";

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD. */
export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date());
}

/** Ngày gần nhất (tính cả hôm nay) rơi vào thứ `weekday` (0 = CN). */
export function nextPlayDate(weekday: number, from = todayISO()) {
  const d = new Date(`${from}T00:00:00Z`);
  const diff = (weekday - d.getUTCDay() + 7) % 7;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${WEEKDAYS[d.getUTCDay()]}, ${dd}/${mm}/${d.getUTCFullYear()}`;
}

export function formatRating(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
