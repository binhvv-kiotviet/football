import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "bongda_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 ngày

function password() {
  const pw = process.env.ADMIN_PASSWORD;
  if (pw) return pw;
  if (process.env.VERCEL) throw new Error("Chưa cấu hình ADMIN_PASSWORD trên Vercel.");
  return "admin"; // chỉ dùng khi chạy local
}

// Token phụ thuộc vào mật khẩu: đổi ADMIN_PASSWORD là mọi phiên đăng nhập cũ hết hiệu lực.
function token() {
  return createHmac("sha256", password()).update("bongda-admin-v1").digest("hex");
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function checkPassword(input: string) {
  return safeEqual(input, password());
}

export async function isAdmin() {
  const value = (await cookies()).get(COOKIE)?.value;
  return !!value && safeEqual(value, token());
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function setAdminCookie() {
  (await cookies()).set(COOKIE, token(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearAdminCookie() {
  (await cookies()).delete(COOKIE);
}
