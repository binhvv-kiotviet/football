import "server-only";
import { query } from "./db";
import { TIMEZONE, type Position } from "./constants";
import type { Stats } from "./stats";

export type Settings = {
  group_name: string;
  play_day: number;
  play_time: string;
  venue: string;
  team_count: number;
  players_per_team: number;
};

export type Member = {
  id: number;
  name: string;
  nickname: string;
  position: Position;
  secondary_position: Position | null;
  rating: number; // chỉ số tổng (OVR)
  active: boolean;
} & Stats;

export type SessionStatus = "draft" | "locked" | "cancelled";

export type Session = {
  id: number;
  play_date: string; // YYYY-MM-DD
  play_time: string;
  venue: string;
  team_count: number;
  status: SessionStatus;
  note: string;
  player_count: number;
};

export type SessionPlayer = {
  id: number;
  member_id: number | null;
  name: string;
  position: Position;
  rating: number;
  is_guest: boolean;
  team_index: number | null;
};

const SESSION_COLUMNS = `s.id, to_char(s.play_date, 'YYYY-MM-DD') AS play_date, s.play_time, s.venue,
  s.team_count, s.status, s.note,
  (SELECT COUNT(*)::int FROM session_players sp WHERE sp.session_id = s.id) AS player_count`;

export async function getSettings() {
  const [row] = await query<Settings>(
    `SELECT group_name, play_day, play_time, venue, team_count, players_per_team FROM settings WHERE id = 1`,
  );
  return row;
}

export async function getMembers(onlyActive = false, order: "position" | "rating" = "position") {
  return query<Member>(
    `SELECT id, name, nickname, position, secondary_position, rating, active, pac, sho, pas, dri, def, phy FROM members
     ${onlyActive ? "WHERE active" : ""}
     ORDER BY active DESC, ${order === "rating" ? "rating DESC," : "CASE position WHEN 'GK' THEN 0 WHEN 'DF' THEN 1 WHEN 'MF' THEN 2 ELSE 3 END,"} name`,
  );
}

export async function getSessions(opts: { onlyLocked?: boolean; limit?: number } = {}) {
  return query<Session>(
    `SELECT ${SESSION_COLUMNS} FROM sessions s
     ${opts.onlyLocked ? "WHERE s.status = 'locked'" : ""}
     ORDER BY s.play_date DESC, s.id DESC
     LIMIT $1`,
    [opts.limit ?? 200],
  );
}

export async function getSession(id: number) {
  if (!Number.isInteger(id)) return undefined;
  const [row] = await query<Session>(`SELECT ${SESSION_COLUMNS} FROM sessions s WHERE s.id = $1`, [id]);
  return row;
}

/** Buổi sắp tới (từ hôm nay trở đi, chưa huỷ); nếu không có thì buổi đã chốt gần nhất. */
export async function getCurrentSession(today: string) {
  const [upcoming] = await query<Session>(
    `SELECT ${SESSION_COLUMNS} FROM sessions s
     WHERE s.play_date >= $1::date AND s.status <> 'cancelled'
     ORDER BY s.play_date ASC, s.id ASC LIMIT 1`,
    [today],
  );
  if (upcoming) return upcoming;
  const [last] = await query<Session>(
    `SELECT ${SESSION_COLUMNS} FROM sessions s WHERE s.status = 'locked'
     ORDER BY s.play_date DESC, s.id DESC LIMIT 1`,
  );
  return last;
}

export async function getSessionPlayers(sessionId: number) {
  return query<SessionPlayer>(
    `SELECT id, member_id, name, position, rating, is_guest, team_index FROM session_players
     WHERE session_id = $1
     ORDER BY CASE position WHEN 'GK' THEN 0 WHEN 'DF' THEN 1 WHEN 'MF' THEN 2 ELSE 3 END, rating DESC, name`,
    [sessionId],
  );
}

export function groupByTeam(players: SessionPlayer[], teamCount: number) {
  const teams: SessionPlayer[][] = Array.from({ length: teamCount }, () => []);
  const unassigned: SessionPlayer[] = [];
  for (const p of players) {
    if (p.team_index !== null && p.team_index < teamCount) teams[p.team_index].push(p);
    else unassigned.push(p);
  }
  return { teams, unassigned };
}

/** Các buổi đã chốt gần đây kèm danh sách cầu thủ, để hiện lịch sử chia đội ở trang chủ. */
export async function getRecentLocked(limit: number, excludeId?: number) {
  const sessions = (await getSessions({ onlyLocked: true, limit: limit + 1 }))
    .filter((s) => s.id !== excludeId)
    .slice(0, limit);
  if (sessions.length === 0) return [];
  const players = await query<SessionPlayer & { session_id: number }>(
    `SELECT id, session_id, member_id, name, position, rating, is_guest, team_index FROM session_players
     WHERE session_id = ANY($1::int[])
     ORDER BY CASE position WHEN 'GK' THEN 0 WHEN 'DF' THEN 1 WHEN 'MF' THEN 2 ELSE 3 END, rating DESC, name`,
    [sessions.map((s) => s.id)],
  );
  return sessions.map((s) => ({
    session: s,
    teams: groupByTeam(players.filter((p) => p.session_id === s.id), s.team_count).teams,
  }));
}

export type SplitLogPlayer = { name: string; position: Position; rating: number };

export type SplitLog = {
  id: number;
  session_id: number;
  play_date: string;
  status: SessionStatus;
  attempt: number; // lần chia thứ mấy trong buổi
  created_at: string; // giờ Việt Nam, dạng "HH:MI DD/MM/YYYY"
  diff: number;
  teams: SplitLogPlayer[][];
};

/** Lịch sử các lần bấm chia đội, mới nhất trước. */
export async function getSplitLogs(opts: { sessionId?: number; limit?: number } = {}) {
  const rows = await query<Omit<SplitLog, "teams"> & { teams: SplitLogPlayer[][] | string }>(
    `SELECT l.id, l.session_id, to_char(s.play_date, 'YYYY-MM-DD') AS play_date, s.status,
       ROW_NUMBER() OVER (PARTITION BY l.session_id ORDER BY l.created_at, l.id)::int AS attempt,
       to_char(l.created_at AT TIME ZONE '${TIMEZONE}', 'HH24:MI DD/MM/YYYY') AS created_at,
       l.diff, l.teams
     FROM split_logs l JOIN sessions s ON s.id = l.session_id
     ${opts.sessionId ? "WHERE l.session_id = $2" : ""}
     ORDER BY l.created_at DESC, l.id DESC
     LIMIT $1`,
    opts.sessionId ? [opts.limit ?? 200, opts.sessionId] : [opts.limit ?? 200],
  );
  return rows.map((r) => ({ ...r, teams: typeof r.teams === "string" ? JSON.parse(r.teams) : r.teams }) as SplitLog);
}
