import "server-only";
import { connection } from "next/server";
import { SEED_MEMBERS, seedStats } from "./seed";
import { overall, STAT_KEYS } from "./stats";

// Trên Vercel: dùng Postgres (Neon) qua DATABASE_URL.
// Chạy local không có DATABASE_URL: dùng PGlite (Postgres nhúng, lưu file trong .data/).

type Runner = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1,
    group_name TEXT NOT NULL DEFAULT 'Đội bóng',
    play_day INT NOT NULL DEFAULT 4,
    play_time TEXT NOT NULL DEFAULT '19:00',
    venue TEXT NOT NULL DEFAULT '',
    team_count INT NOT NULL DEFAULT 2,
    players_per_team INT NOT NULL DEFAULT 7
  )`,
  `ALTER TABLE settings ADD COLUMN IF NOT EXISTS seeded BOOLEAN NOT NULL DEFAULT FALSE`,
  `INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`,
  `CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    nickname TEXT NOT NULL DEFAULT '',
    position TEXT NOT NULL DEFAULT 'MF',
    secondary_position TEXT,
    rating REAL NOT NULL DEFAULT 60,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  // Chỉ số kiểu FIFA; rating = chỉ số tổng (OVR) tính từ 6 chỉ số theo vị trí
  ...STAT_KEYS.map((k) => `ALTER TABLE members ADD COLUMN IF NOT EXISTS ${k} INT NOT NULL DEFAULT 60`),
  `CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    play_date DATE NOT NULL,
    play_time TEXT NOT NULL DEFAULT '',
    venue TEXT NOT NULL DEFAULT '',
    team_count INT NOT NULL DEFAULT 2,
    status TEXT NOT NULL DEFAULT 'draft',
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_at TIMESTAMPTZ
  )`,
  `CREATE TABLE IF NOT EXISTS session_players (
    id SERIAL PRIMARY KEY,
    session_id INT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    member_id INT REFERENCES members(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    rating REAL NOT NULL,
    is_guest BOOLEAN NOT NULL DEFAULT FALSE,
    team_index INT
  )`,
  `CREATE INDEX IF NOT EXISTS session_players_session_idx ON session_players(session_id)`,
  // Mỗi lần bấm chia đội lưu lại 1 bản: đội hình tại thời điểm chia (tên, vị trí, chỉ số) và độ chênh
  `CREATE TABLE IF NOT EXISTS split_logs (
    id SERIAL PRIMARY KEY,
    session_id INT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    diff REAL NOT NULL,
    teams JSONB NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS split_logs_session_idx ON split_logs(session_id)`,
];

/** Tạo sẵn thành viên đúng 1 lần (lần đầu DB được khởi tạo), xoá đi sẽ không tự tạo lại. */
async function seedOnce(run: Runner) {
  const [flag] = await run(`UPDATE settings SET seeded = TRUE WHERE id = 1 AND NOT seeded RETURNING id`);
  if (!flag) return;
  const [{ n }] = await run(`SELECT COUNT(*)::int AS n FROM members`);
  if (Number(n) > 0) return;
  const rows = SEED_MEMBERS.map((m) => ({ ...m, s: seedStats(m) }));
  await run(
    `INSERT INTO members (name, nickname, position, rating, ${STAT_KEYS.join(", ")})
     SELECT * FROM UNNEST($1::text[], $2::text[], $3::text[], $4::real[], ${STAT_KEYS.map((_, i) => `$${i + 5}::int[]`).join(", ")})`,
    [
      rows.map((m) => m.name),
      rows.map((m) => m.nickname),
      rows.map((m) => m.position),
      rows.map((m) => overall(m.position, m.s)),
      ...STAT_KEYS.map((k) => rows.map((m) => m.s[k])),
    ],
  );
}

declare global {
  // Giữ qua các lần hot-reload khi chạy dev (PGlite không mở được 2 lần cùng thư mục)
  var __bongdaConn: Promise<Runner> | undefined;
  var __bongdaReady: { key: string; promise: Promise<void> } | undefined;
  /** Tên cũ của kết nối (bản trước); dùng lại nếu server dev đang chạy từ bản cũ. */
  var __bongdaDb: Promise<Runner> | undefined;
}

async function connect(): Promise<Runner> {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    return (text, params = []) => sql.query(text, params) as Promise<Record<string, unknown>[]>;
  }
  if (process.env.VERCEL) {
    throw new Error("Chưa cấu hình DATABASE_URL. Hãy kết nối Neon Postgres trong Vercel (Storage).");
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  // PGLITE_DIR: đổi chỗ lưu DB local (VD khi chạy thử song song, tránh đụng DB đang dùng)
  const dir = process.env.PGLITE_DIR ?? "./.data/pglite";
  mkdirSync(dir, { recursive: true });
  const db = new PGlite(dir);
  return async (text, params = []) => (await db.query<Record<string, unknown>>(text, params)).rows;
}

// Đổi SCHEMA thì key đổi theo → tự chạy lại phần tạo bảng, kể cả khi server dev đang chạy sẵn.
const SCHEMA_KEY = SCHEMA.join(";");

async function getRunner() {
  globalThis.__bongdaConn ??= (globalThis.__bongdaDb ?? connect()).catch((err) => {
    globalThis.__bongdaConn = undefined;
    throw err;
  });
  const run = await globalThis.__bongdaConn;
  if (globalThis.__bongdaReady?.key !== SCHEMA_KEY) {
    const promise = (async () => {
      for (const stmt of SCHEMA) await run(stmt);
      await seedOnce(run);
    })().catch((err) => {
      globalThis.__bongdaReady = undefined;
      throw err;
    });
    globalThis.__bongdaReady = { key: SCHEMA_KEY, promise };
  }
  await globalThis.__bongdaReady.promise;
  return run;
}

export async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
  await connection();
  const run = await getRunner();
  return (await run(text, params)) as T[];
}
