import { requireAdmin } from "@/lib/auth";
import { saveSettings } from "@/lib/actions";
import { MAX_TEAMS, WEEKDAYS } from "@/lib/constants";
import { getSettings } from "@/lib/data";
import { ActionForm, SubmitButton } from "@/components/forms";

export default async function SettingsPage() {
  await requireAdmin();
  const s = await getSettings();
  return (
    <ActionForm action={saveSettings} className="card max-w-xl space-y-4">
      <h1 className="page-title">Cài đặt</h1>
      <div>
        <label htmlFor="group_name" className="label">
          Tên nhóm
        </label>
        <input id="group_name" name="group_name" defaultValue={s.group_name} required className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="play_day" className="label">
            Ngày đá hàng tuần
          </label>
          <select id="play_day" name="play_day" defaultValue={s.play_day} className="input">
            {WEEKDAYS.map((d, i) => (
              <option key={i} value={i}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="play_time" className="label">
            Giờ đá
          </label>
          <input id="play_time" name="play_time" type="time" defaultValue={s.play_time} className="input" />
        </div>
        <div>
          <label htmlFor="team_count" className="label">
            Số đội mặc định
          </label>
          <select id="team_count" name="team_count" defaultValue={s.team_count} className="input">
            {Array.from({ length: MAX_TEAMS - 1 }, (_, i) => i + 2).map((n) => (
              <option key={n} value={n}>
                {n} đội
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="players_per_team" className="label">
            Số người mỗi đội (sân 5, 7, 11…)
          </label>
          <input
            id="players_per_team"
            name="players_per_team"
            type="number"
            min={3}
            max={11}
            defaultValue={s.players_per_team}
            className="input"
          />
        </div>
      </div>
      <div>
        <label htmlFor="venue" className="label">
          Sân
        </label>
        <input id="venue" name="venue" defaultValue={s.venue} placeholder="VD: Sân Hoàng Mai, sân số 3" className="input" />
      </div>
      <p className="text-sm text-muted">Thay đổi chỉ áp dụng cho các buổi đá tạo mới, buổi đã có giữ nguyên.</p>
      <SubmitButton>Lưu cài đặt</SubmitButton>
    </ActionForm>
  );
}
