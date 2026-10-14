import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  addGuest,
  autoSplit,
  deleteSession,
  movePlayer,
  removePlayer,
  saveAttendance,
  setSessionStatus,
  updateSessionInfo,
} from "@/lib/actions";
import { formatDate, formatRating, MAX_TEAMS, POSITION_LABELS, POSITIONS, TEAMS } from "@/lib/constants";
import {
  getMembers,
  getSession,
  getSessionPlayers,
  getSettings,
  groupByTeam,
  getSplitLogs,
  type Session,
  type SessionPlayer,
} from "@/lib/data";
import { ActionForm, AutoSubmitSelect, ConfirmButton, SubmitButton } from "@/components/forms";
import { AttendanceTools } from "@/components/attendance-tools";
import { CopyButton } from "@/components/copy-button";
import { SplitHistory } from "@/components/split-log-list";
import { SplitPanels } from "@/components/split-panels";
import {
  PositionBadge,
  StatusBadge,
  TEAM_CARD,
  TEAM_ROW,
  TeamCard,
  teamGridClass,
  TeamHeader,
  teamsText,
} from "@/components/team";

export default async function AdminSessionPage({ params }: PageProps<"/admin/sessions/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const session = await getSession(Number(id));
  if (!session) notFound();
  const [players, members, settings, logs] = await Promise.all([
    getSessionPlayers(session.id),
    getMembers(),
    getSettings(),
    getSplitLogs({ sessionId: session.id }),
  ]);
  const { teams, unassigned } = groupByTeam(players, session.team_count);
  const editable = session.status !== "locked";
  const totals = teams.map((t) => t.reduce((s, p) => s + p.rating, 0));
  const diff = Math.max(...totals) - Math.min(...totals);
  const capacity = session.team_count * settings.players_per_team;

  const lineup = (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold">Đội hình</h2>
        {players.length > 0 && unassigned.length < players.length && (
          <span className="text-sm text-muted">
            Chênh lệch tổng điểm:{" "}
            <b className={diff <= 5 ? "text-emerald-600" : diff <= 15 ? "text-amber-600" : "text-red-600"}>
              {formatRating(Math.round(diff * 10) / 10)}
            </b>
          </span>
        )}
        {editable && players.length >= session.team_count && (
          <form action={autoSplit} className="ml-auto">
            <input type="hidden" name="session_id" value={session.id} />
            <SubmitButton pendingText="Đang chia…">
              {unassigned.length === players.length ? "⚡ Chia đội tự động" : "🔀 Chia lại"}
            </SubmitButton>
          </form>
        )}
      </div>

      {players.length === 0 ? (
        <p className="text-muted">Chưa có ai trong buổi này. Hãy điểm danh trước.</p>
      ) : editable ? (
        <>
          {unassigned.length > 0 && (
            <div className="card border-dashed">
              <h3 className="font-semibold">Chưa xếp đội ({unassigned.length})</h3>
              <PlayerRows session={session} players={unassigned} />
            </div>
          )}
          <div className={teamGridClass(session.team_count)}>
            {teams.map((t, i) => (
              <div key={i} className={`${TEAM_CARD} ${TEAMS[i].border}`}>
                <TeamHeader index={i} players={t} showRating />
                <PlayerRows session={session} players={t} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className={teamGridClass(session.team_count)}>
            {teams.map((t, i) => (
              <TeamCard key={i} index={i} players={t} showRating />
            ))}
          </div>
          <CopyButton text={teamsText(settings.group_name, session, teams)} />
        </>
      )}
      <SplitHistory logs={logs} />
    </section>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/admin" className="text-sm text-muted hover:text-fg">
          ‹ Buổi đá
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="page-title">{formatDate(session.play_date)}</h1>
        <StatusBadge status={session.status} />
        <StatusActions session={session} canLock={players.length > 0 && unassigned.length === 0} />
      </div>

      {editable && <InfoForm session={session} />}

      {editable && session.status !== "cancelled" ? (
        <SplitPanels
          leftLabel={`Điểm danh (${players.length})`}
          rightLabel={unassigned.length === players.length ? "Đội hình" : `Đội hình · lệch ${Math.round(diff)}`}
          left={<Attendance session={session} players={players} members={members} capacity={capacity} />}
          right={lineup}
        />
      ) : (
        <div className="@container">{lineup}</div>
      )}
    </div>
  );
}

function StatusActions({ session, canLock }: { session: Session; canLock: boolean }) {
  const btn = (status: string, label: string, cls = "btn-secondary", disabled = false, title?: string) => (
    <form action={setSessionStatus}>
      <input type="hidden" name="session_id" value={session.id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton className={cls} disabled={disabled} title={title}>
        {label}
      </SubmitButton>
    </form>
  );
  return (
    <div className="flex flex-wrap gap-2 sm:ml-auto">
      {session.status === "draft" &&
        btn("locked", "✓ Chốt đội", "btn-primary", !canLock, canLock ? undefined : "Cần xếp đội cho tất cả mọi người")}
      {session.status === "locked" && btn("draft", "Mở khoá để sửa")}
      {session.status === "draft" && btn("cancelled", "Huỷ buổi")}
      {session.status === "cancelled" && btn("draft", "Khôi phục")}
      {session.status !== "locked" && (
        <form action={deleteSession}>
          <input type="hidden" name="session_id" value={session.id} />
          <ConfirmButton message="Xoá hẳn buổi đá này?">Xoá</ConfirmButton>
        </form>
      )}
      {session.status === "locked" && (
        <Link href={`/sessions/${session.id}`} className="btn-secondary">
          Xem trang công khai
        </Link>
      )}
    </div>
  );
}

function InfoForm({ session }: { session: Session }) {
  return (
    <details className="card">
      <summary className="cursor-pointer font-semibold">
        Thông tin buổi đá
        <span className="ml-2 text-sm font-normal text-muted">
          {[session.play_time, session.venue, `${session.team_count} đội`].filter(Boolean).join(" · ")}
        </span>
      </summary>
      <ActionForm action={updateSessionInfo} className="mt-4 space-y-3">
        <input type="hidden" name="session_id" value={session.id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="play_date">
              Ngày
            </label>
            <input
              id="play_date"
              name="play_date"
              type="date"
              defaultValue={session.play_date}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="play_time">
              Giờ
            </label>
            <input id="play_time" name="play_time" type="time" defaultValue={session.play_time} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="venue">
              Sân
            </label>
            <input id="venue" name="venue" defaultValue={session.venue} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="team_count">
              Số đội
            </label>
            <select id="team_count" name="team_count" defaultValue={session.team_count} className="input">
              {Array.from({ length: MAX_TEAMS - 1 }, (_, i) => i + 2).map((n) => (
                <option key={n} value={n}>
                  {n} đội
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="note">
            Ghi chú
          </label>
          <input
            id="note"
            name="note"
            defaultValue={session.note}
            placeholder="VD: Mang áo tối màu"
            className="input"
          />
        </div>
        <SubmitButton>Lưu</SubmitButton>
      </ActionForm>
    </details>
  );
}

function Attendance({
  session,
  players,
  members,
  capacity,
}: {
  session: Session;
  players: SessionPlayer[];
  members: Awaited<ReturnType<typeof getMembers>>;
  capacity: number;
}) {
  const inSession = new Set(players.map((p) => p.member_id));
  // Thành viên đang hoạt động + những người đã có trong buổi (kể cả đã nghỉ)
  const list = members.filter((m) => m.active || inSession.has(m.id));
  const guests = players.filter((p) => p.is_guest);
  const memberCount = players.length - guests.length;

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className="text-lg font-semibold">Điểm danh</h2>
        <span className={`text-sm ${players.length > capacity ? "text-amber-600" : "text-muted"}`}>
          {players.length}/{capacity} người ({memberCount} thành viên, {guests.length} khách)
        </span>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-muted">
          Chưa có thành viên.{" "}
          <Link href="/admin/members" className="text-accent underline">
            Thêm thành viên
          </Link>
        </p>
      ) : (
        <form action={saveAttendance} className="space-y-3">
          <input type="hidden" name="session_id" value={session.id} />
          <AttendanceTools total={list.length} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 @lg:grid-cols-3">
            {list.map((m) => (
              <label key={m.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-bg">
                <input
                  type="checkbox"
                  name="member_id"
                  value={m.id}
                  defaultChecked={inSession.has(m.id)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                <PositionBadge position={m.position} />
                <span className="truncate">{m.nickname || m.name}</span>
              </label>
            ))}
          </div>
          <SubmitButton className="btn-secondary">Lưu điểm danh</SubmitButton>
        </form>
      )}

      <details>
        <summary className="cursor-pointer text-sm font-medium">+ Thêm hát rong</summary>
        <ActionForm action={addGuest} className="mt-3 flex flex-wrap items-end gap-2" resetOnSuccess>
          <input type="hidden" name="session_id" value={session.id} />
          <div className="min-w-40 flex-1">
            <label className="label" htmlFor="guest-name">
              Tên
            </label>
            <input id="guest-name" name="name" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="guest-pos">
              Vị trí
            </label>
            <select id="guest-pos" name="position" defaultValue="MF" className="input">
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {POSITION_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <label className="label" htmlFor="guest-rating">
              Chỉ số tổng
            </label>
            <input id="guest-rating" name="rating" type="number" min={1} max={99} defaultValue={60} className="input" />
          </div>
          <SubmitButton className="btn-secondary">Thêm</SubmitButton>
        </ActionForm>
      </details>
    </section>
  );
}

function PlayerRows({ session, players }: { session: Session; players: SessionPlayer[] }) {
  return (
    <ul className="mt-3 space-y-1.5">
      {players.map((p) => (
        <li key={p.id} className={TEAM_ROW}>
          <PositionBadge position={p.position} />
          <span className="min-w-0 flex-1 truncate">{p.name}</span>
          <span className="text-xs tabular-nums text-muted sm:text-sm">{formatRating(p.rating)}</span>
          <form action={movePlayer} className="relative shrink-0">
            <input type="hidden" name="session_id" value={session.id} />
            <input type="hidden" name="player_id" value={p.id} />
            {/* Nút nhỏ hiển thị, ô chọn trong suốt phủ lên để bấm vào là mở danh sách đội */}
            <span
              aria-hidden
              className="flex h-6 w-6 items-center justify-center rounded border border-line bg-surface text-xs text-muted"
            >
              {p.team_index === null ? "+" : "⇄"}
            </span>
            <AutoSubmitSelect
              name="team_index"
              defaultValue={p.team_index ?? ""}
              title="Chuyển đội"
              aria-label={`Chuyển ${p.name} sang đội`}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              <option value="">— Chưa xếp</option>
              {Array.from({ length: session.team_count }, (_, i) => (
                <option key={i} value={i}>
                  {TEAMS[i].name}
                </option>
              ))}
            </AutoSubmitSelect>
          </form>
          {p.is_guest && (
            <form action={removePlayer} className="shrink-0">
              <input type="hidden" name="session_id" value={session.id} />
              <input type="hidden" name="player_id" value={p.id} />
              <button className="px-0.5 text-muted hover:text-red-600" aria-label={`Xoá ${p.name}`}>
                ×
              </button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
