import Link from "next/link";
import { formatDate, TEAMS } from "@/lib/constants";
import type { SplitLog } from "@/lib/data";
import { StatusBadge } from "./team";

function diffClass(diff: number) {
  return diff <= 5 ? "text-emerald-600" : diff <= 15 ? "text-amber-600" : "text-red-600";
}

/**
 * Danh sách các lần bấm chia đội.
 * `showSession`: hiện ngày buổi đá (dùng ở trang tổng hợp); `sessionHref` trả về link tới buổi đá, hoặc null nếu không được xem.
 */
export function SplitLogList({
  logs,
  showSession,
  sessionHref,
}: {
  logs: SplitLog[];
  showSession?: boolean;
  sessionHref?: (log: SplitLog) => string | null;
}) {
  if (logs.length === 0) return <p className="text-sm text-muted">Chưa có lần chia nào.</p>;
  return (
    <ul className="space-y-2">
      {logs.map((l) => (
        <li key={l.id} className="card space-y-1.5 p-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
            {showSession && <SessionLabel log={l} href={sessionHref?.(l) ?? null} />}
            <span className="font-semibold">Lần {l.attempt}</span>
            <span className="text-muted">· {l.created_at}</span>
            <span className="ml-auto text-muted">
              lệch <b className={diffClass(l.diff)}>{Math.round(l.diff)}</b>
            </span>
          </div>
          {l.teams.map((t, i) => (
            <p key={i} className="flex gap-2 text-sm">
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${TEAMS[i].dot}`} />
              <span className="text-muted">
                <b className="text-fg">{TEAMS[i].name.replace("Đội ", "")}</b> ({t.reduce((s, p) => s + p.rating, 0)}
                ): {t.map((p) => p.name).join(", ")}
              </span>
            </p>
          ))}
        </li>
      ))}
    </ul>
  );
}

function SessionLabel({ log, href }: { log: SplitLog; href: string | null }) {
  const date = formatDate(log.play_date);
  return (
    <>
      {href ? (
        <Link href={href} className="font-medium hover:underline">
          {date}
        </Link>
      ) : (
        <span className="font-medium">{date}</span>
      )}
      {log.status !== "locked" && <StatusBadge status={log.status} />}
    </>
  );
}

/** Mục thu gọn "Lịch sử chia của buổi này" trong trang một buổi đá. */
export function SplitHistory({ logs }: { logs: SplitLog[] }) {
  if (logs.length === 0) return null;
  return (
    <details>
      <summary className="cursor-pointer text-sm font-medium">Lịch sử chia của buổi này ({logs.length} lần)</summary>
      <div className="mt-3">
        <SplitLogList logs={logs} />
      </div>
    </details>
  );
}
