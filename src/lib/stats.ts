import type { Position } from "./constants";

// 6 chỉ số kiểu thẻ FIFA (thang 1–99). Thủ môn dùng chung 6 ô nhưng mang ý nghĩa khác, giống thẻ FIFA.
export const STAT_KEYS = ["pac", "sho", "pas", "dri", "def", "phy"] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

const FIELD_LABELS: Record<StatKey, [string, string]> = {
  pac: ["PAC", "Tốc độ"],
  sho: ["SHO", "Sút"],
  pas: ["PAS", "Chuyền"],
  dri: ["DRI", "Rê bóng"],
  def: ["DEF", "Phòng ngự"],
  phy: ["PHY", "Thể lực"],
};

const GK_LABELS: Record<StatKey, [string, string]> = {
  pac: ["DIV", "Đổ người"],
  sho: ["HAN", "Bắt bóng"],
  pas: ["KIC", "Phát bóng"],
  dri: ["REF", "Phản xạ"],
  def: ["SPD", "Tốc độ"],
  phy: ["POS", "Chọn vị trí"],
};

export function statLabels(position: Position) {
  return position === "GK" ? GK_LABELS : FIELD_LABELS;
}

// Trọng số tính chỉ số tổng (OVR) theo vị trí, mỗi dòng cộng lại = 1.
const WEIGHTS: Record<Position, Stats> = {
  GK: { pac: 0.24, sho: 0.22, pas: 0.06, dri: 0.24, def: 0.04, phy: 0.2 },
  DF: { pac: 0.14, sho: 0.02, pas: 0.1, dri: 0.06, def: 0.46, phy: 0.22 },
  MF: { pac: 0.12, sho: 0.16, pas: 0.32, dri: 0.24, def: 0.06, phy: 0.1 },
  FW: { pac: 0.22, sho: 0.34, pas: 0.1, dri: 0.24, def: 0.0, phy: 0.1 },
};

export function overall(position: Position, s: Stats) {
  const w = WEIGHTS[position];
  return Math.round(STAT_KEYS.reduce((sum, k) => sum + s[k] * w[k], 0));
}

export function clampStat(n: number) {
  return Math.min(99, Math.max(1, Math.round(n)));
}

export type CardTier = "gold" | "silver" | "bronze";

export function cardTier(ovr: number): CardTier {
  return ovr >= 75 ? "gold" : ovr >= 65 ? "silver" : "bronze";
}
