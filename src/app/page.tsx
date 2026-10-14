import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { formatDate, TEAMS, todayISO, WEEKDAYS } from "@/lib/constants";
import {
  getCurrentSession,
  getMembers,
  getRecentLocked,
  getSessionPlayers,
  getSettings,
  groupByTeam,
  type Session,
  type SessionPlayer,
} from "@/lib/data";
import { CopyButton } from "@/components/copy-button";
import { PlayerCard } from "@/components/player-card";
import { PLAYERS_ANCHOR, ScrollIfTargeted } from "@/components/players-link";
import { PositionBadge, StatusBadge, TeamCard, teamGridClass, teamsText } from "@/components/team";

export default async function Home() {
  const [settings, admin, members] = await Promise.all([getSettings(), isAdmin(), getMembers(true, "rating")]);
  const session = await getCurrentSession(todayISO());
  const [players, recent] = await Promise.all([
    session ? getSessionPlayers(session.id) : Promise.resolve([]),
    getRecentLocked(5, session?.id),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-bold">{settings.group_name}</h1>
        <p className="text-muted">
          Đá {WEEKDAYS[settings.play_day]} hàng tuần{settings.play_time && ` lúc ${settings.play_time}`}
          {settings.venue && ` · ${settings.venue}`}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Đội hình buổi tới</h2>
        {!session ? (
          <div className="card text-muted">
            Chưa có buổi đá nào.{" "}
            {admin && (
              <Link href="/admin" className="text-accent underline">
                Tạo buổi đá
              </Link>
            )}
          </div>
        ) : (
          <CurrentSession groupName={settings.group_name} session={session} players={players} admin={admin} />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Lịch sử chia đội</h2>
          <Link href="/history" className="text-sm text-accent underline">
            Xem tất cả
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted">Chưa có buổi nào được chốt.</p>
        ) : (
          <ul className="space-y-3">
            {recent.map(({ session: s, teams }) => (
              <li key={s.id}>
                <Link href={`/sessions/${s.id}`} className="card block space-y-1.5 hover:border-accent">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">{formatDate(s.play_date)}</span>
                    <span className="text-xs text-muted">{s.player_count} người</span>
                  </div>
                  {teams.map((t, i) => (
                    <p key={i} className="flex gap-2 text-sm">
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${TEAMS[i].dot}`} />
                      <span className="text-muted">
                        <b className="text-fg">{TEAMS[i].name.replace("Đội ", "")}</b>
                        {" ("}
                        {t.reduce((sum, p) => sum + p.rating, 0)}
                        {"): "}
                        {t.map((p) => p.name).join(", ")}
                      </span>
                    </p>
                  ))}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id={PLAYERS_ANCHOR} className="scroll-mt-4 space-y-4">
        <ScrollIfTargeted />
        <h2 className="text-lg font-semibold">
          Cầu thủ <span className="text-base font-normal text-muted">({members.length})</span>
        </h2>
        {members.length === 0 ? (
          <p className="text-sm text-muted">Chưa có cầu thủ.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {members.map((m) => (
              <PlayerCard key={m.id} p={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CurrentSession({
  groupName,
  session,
  players,
  admin,
}: {
  groupName: string;
  session: Session;
  players: SessionPlayer[];
  admin: boolean;
}) {
  const { teams } = groupByTeam(players, session.team_count);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">
          {formatDate(session.play_date)}
          {session.play_time && ` · ${session.play_time}`}
        </h3>
        <StatusBadge status={session.status} />
        {admin && (
          <Link href={`/admin/sessions/${session.id}`} className="ml-auto text-sm text-accent underline">
            Quản lý buổi này
          </Link>
        )}
      </div>
      {session.venue && <p className="text-sm text-muted">📍 {session.venue}</p>}
      {session.note && <p className="text-sm">📝 {session.note}</p>}

      {session.status === "locked" ? (
        <>
          <div className={teamGridClass(session.team_count)}>
            {teams.map((t, i) => (
              <TeamCard key={i} index={i} players={t} showRating />
            ))}
          </div>
          <CopyButton text={teamsText(groupName, session, teams)} />
        </>
      ) : session.status === "cancelled" ? (
        <div className="card text-muted">Buổi này đã huỷ.</div>
      ) : (
        <div className="card">
          <p className="mb-3 text-muted">Đội chưa được chốt. Danh sách đi đá ({players.length} người):</p>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {players.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <PositionBadge position={p.position} />
                <span className="flex-1">{p.name}</span>
                <span className="text-sm tabular-nums text-muted">{p.rating}</span>
              </li>
            ))}
            {players.length === 0 && <li className="text-sm text-muted">Chưa có ai điểm danh</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
