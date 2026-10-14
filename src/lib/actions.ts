"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { checkPassword, clearAdminCookie, requireAdmin, setAdminCookie } from "./auth";
import { query } from "./db";
import { getSession, getSessionPlayers, getSettings } from "./data";
import { isPosition, MAX_TEAMS, nextPlayDate, type Position } from "./constants";
import { splitTeams } from "./split";
import { overall, STAT_KEYS, type Stats } from "./stats";

export type FormState = { error?: string; ok?: string } | undefined;

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function int(fd: FormData, key: string) {
  const n = Number(fd.get(key));
  return Number.isInteger(n) ? n : NaN;
}

/** Chỉ số thang 1–99. */
function stat(fd: FormData, key: string) {
  const n = Number(fd.get(key));
  return Number.isFinite(n) && n >= 1 && n <= 99 ? Math.round(n) : NaN;
}

function position(fd: FormData, key = "position"): Position | null {
  const v = fd.get(key);
  return isPosition(v) ? v : null;
}

async function editableSession(id: number) {
  const s = await getSession(id);
  if (!s) throw new Error("Không tìm thấy buổi đá");
  if (s.status === "locked") throw new Error("Buổi đá đã chốt, hãy mở khoá trước khi sửa");
  return s;
}

// ---------- Đăng nhập ----------

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  if (!checkPassword(String(fd.get("password") ?? ""))) return { error: "Sai mật khẩu" };
  await setAdminCookie();
  redirect("/admin");
}

export async function logout() {
  await clearAdminCookie();
  redirect("/");
}

// ---------- Cài đặt ----------

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const playDay = int(fd, "play_day");
  const teamCount = int(fd, "team_count");
  const perTeam = int(fd, "players_per_team");
  const name = str(fd, "group_name");
  if (!name) return { error: "Nhập tên nhóm" };
  if (!(playDay >= 0 && playDay <= 6)) return { error: "Ngày đá không hợp lệ" };
  if (!(teamCount >= 2 && teamCount <= MAX_TEAMS)) return { error: `Số đội từ 2 đến ${MAX_TEAMS}` };
  if (!(perTeam >= 3 && perTeam <= 11)) return { error: "Số người mỗi đội từ 3 đến 11" };
  await query(
    `UPDATE settings SET group_name = $1, play_day = $2, play_time = $3, venue = $4,
       team_count = $5, players_per_team = $6 WHERE id = 1`,
    [name, playDay, str(fd, "play_time"), str(fd, "venue"), teamCount, perTeam],
  );
  refresh();
  return { ok: "Đã lưu cài đặt" };
}

// ---------- Thành viên ----------

export async function saveMember(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = int(fd, "id");
  const name = str(fd, "name");
  const pos = position(fd);
  const secondary = position(fd, "secondary_position");
  if (!name) return { error: "Nhập tên thành viên" };
  if (!pos) return { error: "Chọn vị trí" };
  const stats = Object.fromEntries(STAT_KEYS.map((k) => [k, stat(fd, k)])) as Stats;
  if (STAT_KEYS.some((k) => Number.isNaN(stats[k]))) return { error: "Các chỉ số phải từ 1 đến 99" };
  const params = [
    name,
    str(fd, "nickname"),
    pos,
    secondary === pos ? null : secondary,
    overall(pos, stats),
    fd.get("active") === "on",
    ...STAT_KEYS.map((k) => stats[k]),
  ];
  const isEdit = Number.isInteger(id) && id > 0;
  if (isEdit) {
    await query(
      `UPDATE members SET name = $1, nickname = $2, position = $3, secondary_position = $4, rating = $5, active = $6,
         pac = $7, sho = $8, pas = $9, dri = $10, def = $11, phy = $12
       WHERE id = $13`,
      [...params, id],
    );
  } else {
    await query(
      `INSERT INTO members (name, nickname, position, secondary_position, rating, active, pac, sho, pas, dri, def, phy)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      params,
    );
  }
  refresh();
  return { ok: isEdit ? `Đã cập nhật ${name}` : `Đã thêm ${name}` };
}

export async function deleteMember(fd: FormData) {
  await requireAdmin();
  // Lịch sử vẫn giữ tên/vị trí/chỉ số đã lưu trong session_players.
  await query(`DELETE FROM members WHERE id = $1`, [int(fd, "id")]);
  refresh();
}

// ---------- Buổi đá ----------

export async function createSession(fd: FormData) {
  await requireAdmin();
  const settings = await getSettings();
  const date = str(fd, "play_date") || nextPlayDate(settings.play_day);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Ngày không hợp lệ");
  const [row] = await query<{ id: number }>(
    `INSERT INTO sessions (play_date, play_time, venue, team_count) VALUES ($1, $2, $3, $4) RETURNING id`,
    [date, settings.play_time, settings.venue, settings.team_count],
  );
  redirect(`/admin/sessions/${row.id}`);
}

export async function updateSessionInfo(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const s = await editableSession(int(fd, "session_id"));
  const date = str(fd, "play_date");
  const teamCount = int(fd, "team_count");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Ngày không hợp lệ" };
  if (!(teamCount >= 2 && teamCount <= MAX_TEAMS)) return { error: `Số đội từ 2 đến ${MAX_TEAMS}` };
  await query(
    `UPDATE sessions SET play_date = $1, play_time = $2, venue = $3, team_count = $4, note = $5 WHERE id = $6`,
    [date, str(fd, "play_time"), str(fd, "venue"), teamCount, str(fd, "note"), s.id],
  );
  if (teamCount < s.team_count) {
    await query(`UPDATE session_players SET team_index = NULL WHERE session_id = $1 AND team_index >= $2`, [
      s.id,
      teamCount,
    ]);
  }
  refresh();
  return { ok: "Đã lưu" };
}

export async function deleteSession(fd: FormData) {
  await requireAdmin();
  await query(`DELETE FROM sessions WHERE id = $1`, [int(fd, "session_id")]);
  redirect("/admin/sessions");
}

export async function setSessionStatus(fd: FormData) {
  await requireAdmin();
  const id = int(fd, "session_id");
  const status = str(fd, "status");
  const s = await getSession(id);
  if (!s) throw new Error("Không tìm thấy buổi đá");
  if (status === "locked") {
    const players = await getSessionPlayers(id);
    if (players.length === 0) throw new Error("Chưa có ai trong buổi này");
    if (players.some((p) => p.team_index === null || p.team_index >= s.team_count)) {
      throw new Error("Còn người chưa được xếp đội");
    }
    await query(`UPDATE sessions SET status = 'locked', locked_at = NOW() WHERE id = $1`, [id]);
  } else if (status === "draft" || status === "cancelled") {
    await query(`UPDATE sessions SET status = $1, locked_at = NULL WHERE id = $2`, [status, id]);
  }
  refresh();
}

/** Lưu điểm danh: đồng bộ danh sách thành viên đi đá (giữ nguyên khách vãng lai). */
export async function saveAttendance(fd: FormData) {
  await requireAdmin();
  const s = await editableSession(int(fd, "session_id"));
  const selected = new Set(
    fd
      .getAll("member_id")
      .map(Number)
      .filter((n) => Number.isInteger(n)),
  );
  const current = await getSessionPlayers(s.id);
  const currentIds = new Set(current.filter((p) => p.member_id !== null).map((p) => p.member_id!));

  const toRemove = current.filter((p) => !p.is_guest && p.member_id !== null && !selected.has(p.member_id));
  for (const p of toRemove) await query(`DELETE FROM session_players WHERE id = $1`, [p.id]);

  const toAdd = [...selected].filter((id) => !currentIds.has(id));
  if (toAdd.length) {
    // Lưu lại vị trí và chỉ số tại thời điểm đá để lịch sử không đổi khi sửa chỉ số sau này.
    await query(
      `INSERT INTO session_players (session_id, member_id, name, position, rating)
       SELECT $1, m.id, CASE WHEN m.nickname <> '' THEN m.nickname ELSE m.name END, m.position, m.rating
       FROM members m WHERE m.id = ANY($2::int[])`,
      [s.id, toAdd],
    );
  }
  refresh();
}

export async function addGuest(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const s = await editableSession(int(fd, "session_id"));
  const name = str(fd, "name");
  const pos = position(fd);
  const r = stat(fd, "rating");
  if (!name) return { error: "Nhập tên khách" };
  if (!pos) return { error: "Chọn vị trí" };
  if (Number.isNaN(r)) return { error: "Chỉ số tổng từ 1 đến 99" };
  await query(
    `INSERT INTO session_players (session_id, name, position, rating, is_guest) VALUES ($1, $2, $3, $4, TRUE)`,
    [s.id, `${name} (khách)`, pos, r],
  );
  refresh();
  return { ok: `Đã thêm ${name}` };
}

export async function removePlayer(fd: FormData) {
  await requireAdmin();
  const s = await editableSession(int(fd, "session_id"));
  await query(`DELETE FROM session_players WHERE id = $1 AND session_id = $2`, [int(fd, "player_id"), s.id]);
  refresh();
}

export async function autoSplit(fd: FormData) {
  await requireAdmin();
  const s = await editableSession(int(fd, "session_id"));
  const players = await getSessionPlayers(s.id);
  if (players.length < s.team_count) throw new Error("Không đủ người để chia đội");
  const current: number[][] = Array.from({ length: s.team_count }, () => []);
  for (const p of players) if (p.team_index !== null && p.team_index < s.team_count) current[p.team_index].push(p.id);
  const teams = splitTeams(players, s.team_count, current);
  const ids: number[] = [];
  const idx: number[] = [];
  teams.forEach((t, i) => t.forEach((id) => (ids.push(id), idx.push(i))));
  await query(
    `UPDATE session_players sp SET team_index = v.team_index
     FROM UNNEST($1::int[], $2::int[]) AS v(id, team_index)
     WHERE sp.id = v.id AND sp.session_id = $3`,
    [ids, idx, s.id],
  );

  // Lưu lịch sử lần chia này
  const byId = new Map(players.map((p) => [p.id, p]));
  const snapshot = teams.map((t) =>
    t.map((id) => {
      const p = byId.get(id)!;
      return { name: p.name, position: p.position, rating: p.rating };
    }),
  );
  const totals = snapshot.map((t) => t.reduce((sum, p) => sum + p.rating, 0));
  await query(`INSERT INTO split_logs (session_id, diff, teams) VALUES ($1, $2, $3::jsonb)`, [
    s.id,
    Math.max(...totals) - Math.min(...totals),
    JSON.stringify(snapshot),
  ]);
  refresh();
}

export async function movePlayer(fd: FormData) {
  await requireAdmin();
  const s = await editableSession(int(fd, "session_id"));
  const raw = str(fd, "team_index");
  const team = raw === "" ? null : Number(raw);
  if (team !== null && !(Number.isInteger(team) && team >= 0 && team < s.team_count)) {
    throw new Error("Đội không hợp lệ");
  }
  await query(`UPDATE session_players SET team_index = $1 WHERE id = $2 AND session_id = $3`, [
    team,
    int(fd, "player_id"),
    s.id,
  ]);
  refresh();
}
