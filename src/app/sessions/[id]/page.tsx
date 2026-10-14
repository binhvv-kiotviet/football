import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/constants";
import { getSession, getSessionPlayers, getSettings, getSplitLogs, groupByTeam } from "@/lib/data";
import { SplitHistory } from "@/components/split-log-list";
import { CopyButton } from "@/components/copy-button";
import { StatusBadge, TeamCard, teamGridClass, teamsText } from "@/components/team";

export default async function SessionPage({ params }: PageProps<"/sessions/[id]">) {
  const { id } = await params;
  const [session, admin, settings] = await Promise.all([getSession(Number(id)), isAdmin(), getSettings()]);
  // Người xem chỉ thấy buổi đã chốt
  if (!session || (session.status !== "locked" && !admin)) notFound();
  const [players, logs] = await Promise.all([getSessionPlayers(session.id), getSplitLogs({ sessionId: session.id })]);
  const { teams } = groupByTeam(players, session.team_count);

  return (
    <div className="space-y-4">
      <Link href="/history" className="text-sm text-muted hover:text-fg">
        ‹ Lịch sử
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="page-title">{formatDate(session.play_date)}</h1>
        <StatusBadge status={session.status} />
        {admin && (
          <Link href={`/admin/sessions/${session.id}`} className="ml-auto text-sm text-accent underline">
            Quản lý
          </Link>
        )}
      </div>
      {(session.play_time || session.venue) && (
        <p className="text-sm text-muted">{[session.play_time, session.venue].filter(Boolean).join(" · ")}</p>
      )}
      {session.note && <p className="text-sm">📝 {session.note}</p>}
      <div className={teamGridClass(session.team_count)}>
        {teams.map((t, i) => (
          <TeamCard key={i} index={i} players={t} showRating />
        ))}
      </div>
      <CopyButton text={teamsText(settings.group_name, session, teams)} />
      <SplitHistory logs={logs} />
    </div>
  );
}
