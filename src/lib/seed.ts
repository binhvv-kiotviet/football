import type { Position } from "./constants";
import type { Stats } from "./stats";

// Danh sách thành viên tạo sẵn ở lần chạy đầu tiên (database trống).
// Vị trí và chỉ số chỉ là ước lượng ban đầu, admin sửa lại trong trang Thành viên.
// Thứ tự chỉ số: pac, sho, pas, dri, def, phy (thủ môn: DIV, HAN, KIC, REF, SPD, POS).
type Seed = { name: string; nickname: string; position: Position; stats: [number, number, number, number, number, number] };

export const SEED_MEMBERS: Seed[] = [
  { name: "Phùng Thế Hiển", nickname: "Thế Hiển", position: "GK", stats: [70, 68, 60, 72, 55, 66] },
  { name: "Văn Đoan", nickname: "", position: "GK", stats: [64, 66, 58, 65, 52, 63] },
  { name: "Lương Thành Quảng", nickname: "Quảng", position: "DF", stats: [66, 45, 62, 58, 72, 74] },
  { name: "Nguyễn Đại Dương", nickname: "Dương", position: "DF", stats: [70, 48, 58, 60, 68, 70] },
  { name: "Trần Đức Thuận", nickname: "Thuận", position: "DF", stats: [60, 42, 55, 52, 66, 68] },
  { name: "Vũ Mạnh", nickname: "", position: "DF", stats: [64, 50, 60, 56, 70, 72] },
  { name: "Khánh", nickname: "", position: "MF", stats: [68, 62, 72, 70, 55, 64] },
  { name: "Minh Hiếu", nickname: "", position: "MF", stats: [72, 68, 78, 76, 52, 66] },
  { name: "Nguyễn Huy Hoàng", nickname: "Hoàng", position: "MF", stats: [66, 60, 68, 66, 58, 65] },
  { name: "Ngô Tiến Thành", nickname: "Thành", position: "MF", stats: [62, 56, 64, 62, 54, 62] },
  { name: "Minh Hướng", nickname: "", position: "FW", stats: [78, 76, 64, 74, 38, 68] },
  { name: "Nguyễn Huy Tiến", nickname: "Tiến", position: "FW", stats: [74, 72, 60, 70, 40, 66] },
  { name: "Vũ Đức", nickname: "Vũ Đức", position: "FW", stats: [70, 68, 58, 66, 42, 70] },
  { name: "Đạo", nickname: "", position: "GK", stats: [62, 64, 56, 63, 54, 60] },
  { name: "Cao Tiến Điệp", nickname: "Điệp", position: "DF", stats: [64, 46, 58, 56, 68, 70] },
  { name: "Đoàn Tùng", nickname: "Tùng", position: "DF", stats: [62, 44, 56, 54, 66, 68] },
  { name: "Duong Hoang", nickname: "Dương Hoàng", position: "DF", stats: [66, 48, 60, 58, 64, 66] },
  { name: "Hong Son", nickname: "Sơn", position: "MF", stats: [66, 64, 72, 68, 56, 64] },
  { name: "Cao Thái Thịnh", nickname: "Thịnh", position: "MF", stats: [64, 58, 66, 64, 56, 62] },
  { name: "Đức", nickname: "", position: "MF", stats: [62, 60, 64, 62, 52, 60] },
  { name: "Chiến Thắng", nickname: "Thắng", position: "FW", stats: [72, 70, 58, 68, 40, 64] },
  { name: "Duan Lv", nickname: "Duan", position: "FW", stats: [70, 66, 56, 66, 38, 62] },
  { name: "Hiển", nickname: "", position: "FW", stats: [68, 66, 58, 64, 40, 66] },
  { name: "Bình", nickname: "", position: "MF", stats: [79, 78, 80, 79, 76, 78] },
];

export function seedStats(s: Seed): Stats {
  const [pac, sho, pas, dri, def, phy] = s.stats;
  return { pac, sho, pas, dri, def, phy };
}
