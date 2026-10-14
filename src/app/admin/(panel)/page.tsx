import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createSession } from "@/lib/actions";
import { formatDate, nextPlayDate, WEEKDAYS } from "@/lib/constants";
import { getSessions, getSettings } from "@/lib/data";
import { SubmitButton } from "@/components/forms";
import { StatusBadge } from "@/components/team";

export default async function AdminSessionsPage() {
  await requireAdmin();
  const [settings, sessions] = await Promise.all([getSettings(), getSessions()]);
  const next = nextPlayDate(settings.play_day);

  return (
    <div className="space-y-6">
      <section className="card space-y-3">
        <h1 className="page-title">Tạo buổi đá</h1>
        <form action={createSession} className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="play_date" className="label">
              Ngày đá (mặc định {WEEKDAYS[settings.play_day]} tới)
            </label>
            <input id="play_date" name="play_date" type="date" defaultValue={next} className="input" required />
          </div>
          <SubmitButton>+ Tạo buổi</SubmitButton>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Các buổi đá</h2>
        {sessions.length === 0 ? (
          <p className="text-muted">Chưa có buổi nào.</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/sessions/${s.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-bg">
                  <span className="font-medium">{formatDate(s.play_date)}</span>
                  <StatusBadge status={s.status} />
                  <span className="ml-auto text-sm text-muted">
                    {s.team_count} đội · {s.player_count} người
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
