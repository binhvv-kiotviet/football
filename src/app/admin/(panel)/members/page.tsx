import { requireAdmin } from "@/lib/auth";
import { deleteMember, saveMember } from "@/lib/actions";
import { getMembers } from "@/lib/data";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/forms";
import { MemberFields } from "@/components/member-fields";
import { PositionBadge } from "@/components/team";

export default async function MembersPage() {
  await requireAdmin();
  const members = await getMembers();
  const activeCount = members.filter((m) => m.active).length;

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="font-semibold">Thêm thành viên</h2>
        <ActionForm action={saveMember} className="mt-4 space-y-3" resetOnSuccess>
          <MemberFields />
          <SubmitButton>+ Thêm</SubmitButton>
        </ActionForm>
      </section>

      <section className="space-y-3">
        <h1 className="page-title">
          Thành viên <span className="text-base font-normal text-muted">({activeCount} đang hoạt động / {members.length})</span>
        </h1>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id}>
              <details className={`card p-0 ${m.active ? "" : "opacity-60"}`}>
                <summary className="flex cursor-pointer items-center gap-3 px-4 py-3">
                  <PositionBadge position={m.position} />
                  <span className="flex-1 truncate">
                    <span className="font-medium">{m.name}</span>
                    {m.nickname && <span className="text-muted"> ({m.nickname})</span>}
                    {m.secondary_position && <span className="text-xs text-muted"> · phụ {m.secondary_position}</span>}
                    {!m.active && <span className="text-xs text-muted"> · nghỉ</span>}
                  </span>
                  <span className="w-10 text-right font-semibold tabular-nums">{m.rating}</span>
                </summary>
                <div className="space-y-3 border-t border-line p-4">
                  <ActionForm action={saveMember} className="space-y-3">
                    <MemberFields m={m} />
                    <SubmitButton>Lưu</SubmitButton>
                  </ActionForm>
                  <form action={deleteMember}>
                    <input type="hidden" name="id" value={m.id} />
                    <ConfirmButton message={`Xoá ${m.name}? Lịch sử các buổi đã đá vẫn được giữ.`}>Xoá thành viên</ConfirmButton>
                  </form>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
