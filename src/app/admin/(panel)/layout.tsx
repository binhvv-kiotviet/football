import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-2 text-sm">
        <Link href="/admin" className="btn-secondary">
          Buổi đá
        </Link>
        <Link href="/admin/members" className="btn-secondary">
          Thành viên
        </Link>
        <Link href="/admin/settings" className="btn-secondary">
          Cài đặt
        </Link>
      </nav>
      {children}
    </div>
  );
}
