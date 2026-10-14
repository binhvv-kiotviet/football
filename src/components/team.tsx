import { formatDate, formatRating, POSITION_LABELS, POSITION_STYLES, TEAMS, type Position } from "@/lib/constants";
import type { Session, SessionPlayer } from "@/lib/data";

export function PositionBadge({ position }: { position: Position }) {
  return (
    <span
      title={POSITION_LABELS[position]}
      className={`inline-flex w-7 shrink-0 justify-center rounded py-0.5 text-[10px] font-semibold ${POSITION_STYLES[position]}`}
    >
      {position}
    </span>
  );
}

/** Lưới các đội: luôn đặt cạnh nhau (2 cột kể cả trên điện thoại). */
export function teamGridClass(teamCount: number) {
  return `grid grid-cols-2 gap-2 sm:gap-4 ${teamCount === 3 ? "xl:grid-cols-3" : teamCount >= 4 ? "xl:grid-cols-4" : ""}`;
}

export const TEAM_CARD = "card min-w-0 border-t-4 p-2.5 sm:p-4";
export const TEAM_ROW = "flex items-center gap-1.5 text-sm sm:gap-2 sm:text-base";

export function TeamHeader({
  index,
  players,
  showRating,
}: {
  index: number;
  players: SessionPlayer[];
  showRating?: boolean;
}) {
  const team = TEAMS[index];
  const total = players.reduce((s, p) => s + p.rating, 0);
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
      <h3 className="flex items-center gap-1.5 font-semibold whitespace-nowrap">
        <span className={`h-3 w-3 rounded-full ${team.dot}`} />
        {team.name}
        <span className="text-sm font-normal text-muted">({players.length})</span>
      </h3>
      {showRating && players.length > 0 && (
        <span className="text-xs whitespace-nowrap text-muted sm:text-sm">
          Tổng <b className="text-fg">{formatRating(total)}</b> · TB{" "}
          {formatRating(Math.round((total / players.length) * 10) / 10)}
        </span>
      )}
    </div>
  );
}

export function TeamCard({
  index,
  players,
  showRating,
}: {
  index: number;
  players: SessionPlayer[];
  showRating?: boolean;
}) {
  return (
    <div className={`${TEAM_CARD} ${TEAMS[index].border}`}>
      <TeamHeader index={index} players={players} showRating={showRating} />
      <ul className="mt-3 space-y-1.5">
        {players.map((p) => (
          <li key={p.id} className={TEAM_ROW}>
            <PositionBadge position={p.position} />
            <span className="min-w-0 flex-1 truncate">{p.name}</span>
            {showRating && <span className="text-xs tabular-nums text-muted sm:text-sm">{formatRating(p.rating)}</span>}
          </li>
        ))}
        {players.length === 0 && <li className="text-sm text-muted">Chưa có ai</li>}
      </ul>
    </div>
  );
}

export function StatusBadge({ status }: { status: Session["status"] }) {
  const map = {
    draft: ["Chưa chốt", "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"],
    locked: ["Đã chốt đội", "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"],
    cancelled: ["Đã huỷ", "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"],
  } as const;
  const [label, cls] = map[status];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}

/** Văn bản để dán vào Zalo/Messenger. */
export function teamsText(groupName: string, session: Session, teams: SessionPlayer[][]) {
  const lines = [
    `⚽ ${groupName} – ${formatDate(session.play_date)}${session.play_time ? ` lúc ${session.play_time}` : ""}`,
  ];
  if (session.venue) lines.push(`📍 ${session.venue}`);
  teams.forEach((t, i) => {
    lines.push("", `${TEAMS[i].name} (${t.length}):`);
    t.forEach((p, j) => lines.push(`${j + 1}. ${p.name} – ${POSITION_LABELS[p.position]}`));
  });
  if (session.note) lines.push("", `📝 ${session.note}`);
  return lines.join("\n");
}
