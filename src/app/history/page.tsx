import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/constants";
import { getSessions, getSplitLogs } from "@/lib/data";
import { SplitLogList } from "@/components/split-log-list";

const TABS = [
  { key: "da", label: "Đã đá (đã chốt)" },
  { key: "chia", label: "Lịch sử chia" },
] as const;

export default async function HistoryPage({ searchParams }: PageProps<"/history">) {
  const tab = (await searchParams).tab === "chia" ? "chia" : "da";

  return (
    <div className="space-y-4">
      <h1 className="page-title">Lịch sử</h1>
      <nav className="flex gap-1 rounded-lg border border-line bg-bg p-1" aria-label="Loại lịch sử">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "da" ? "/history" : "/history?tab=chia"}
            aria-current={tab === t.key ? "page" : undefined}
            className={`flex-1 rounded-md px-3 py-1.5 text-center text-sm font-medium ${
              tab === t.key ? "bg-surface shadow-sm" : "text-muted hover:text-fg"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {tab === "da" ? <PlayedList /> : <SplitList />}
    </div>
  );
}

async function PlayedList() {
  const sessions = await getSessions({ onlyLocked: true });
  if (sessions.length === 0) return <p className="text-muted">Chưa có buổi nào được chốt.</p>;
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {sessions.map((s) => (
        <li key={s.id}>
          <Link href={`/sessions/${s.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-bg">
            <span className="flex-1 font-medium">{formatDate(s.play_date)}</span>
            <span className="text-sm text-muted">
              {s.team_count} đội · {s.player_count} người
            </span>
            <span className="text-muted">›</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function SplitList() {
  const [logs, admin] = await Promise.all([getSplitLogs({ limit: 100 }), isAdmin()]);
  return (
    <>
      <p className="text-sm text-muted">Mọi lần bấm chia đội, mới nhất trước (100 lần gần nhất).</p>
      <SplitLogList
        logs={logs}
        showSession
        sessionHref={(l) =>
          admin ? `/admin/sessions/${l.session_id}` : l.status === "locked" ? `/sessions/${l.session_id}` : null
        }
      />
    </>
  );
}
