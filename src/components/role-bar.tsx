import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { logout } from "@/lib/actions";

/** Mục cuối thanh menu: cho biết đang xem với tư cách khách hay admin. */
export async function RoleNav() {
  if (await isAdmin()) {
    return (
      <Link href="/admin" className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-fg">
        🔑 Quản trị
      </Link>
    );
  }
  return (
    <Link href="/admin/login" className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-muted hover:text-fg">
      Đăng nhập
    </Link>
  );
}

/** Dải báo hiệu dưới thanh menu, chỉ hiện khi đang đăng nhập admin. */
export async function AdminBanner() {
  if (!(await isAdmin())) return null;
  return (
    <div className="bg-accent text-accent-fg">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-1.5 text-xs font-medium">
        <span className="mr-auto">🔑 Bạn đang ở chế độ QUẢN TRỊ: có thể sửa thành viên, chia đội, chốt đội.</span>
        <form action={logout}>
          <button className="underline underline-offset-2 hover:opacity-80">Đăng xuất</button>
        </form>
      </div>
    </div>
  );
}

/** Dòng nhỏ cho khách biết họ chỉ đang xem. */
export async function GuestNote() {
  if (await isAdmin()) return null;
  return <p className="mb-4 text-xs text-muted">👁 Bạn đang xem với tư cách khách (chỉ xem, không sửa được).</p>;
}
