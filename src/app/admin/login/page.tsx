import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { login } from "@/lib/actions";
import { ActionForm, SubmitButton } from "@/components/forms";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="mx-auto max-w-sm">
      <ActionForm action={login} className="card space-y-4">
        <h1 className="page-title">Đăng nhập quản trị</h1>
        <div>
          <label htmlFor="password" className="label">
            Mật khẩu
          </label>
          <input id="password" name="password" type="password" required autoFocus className="input" />
        </div>
        <SubmitButton className="btn-primary w-full">Đăng nhập</SubmitButton>
      </ActionForm>
    </div>
  );
}
