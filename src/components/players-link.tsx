"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export const PLAYERS_ANCHOR = "cau-thu";

function scrollToPlayers(smooth: boolean) {
  document.getElementById(PLAYERS_ANCHOR)?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
}

/** Link "Cầu thủ" trên menu: đang ở trang chủ thì cuộn thẳng tới phần thẻ, kể cả khi bấm lại lần nữa. */
export function PlayersLink({ className, children }: { className?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <Link
      href={`/#${PLAYERS_ANCHOR}`}
      className={className}
      onClick={(e) => {
        if (pathname !== "/") return;
        e.preventDefault();
        history.replaceState(null, "", `#${PLAYERS_ANCHOR}`);
        scrollToPlayers(true);
      }}
    >
      {children}
    </Link>
  );
}

/** Đặt trong phần thẻ cầu thủ: nếu URL có #cau-thu thì cuộn tới khi phần này vừa hiện ra (dữ liệu tải sau). */
export function ScrollIfTargeted() {
  useEffect(() => {
    if (location.hash === `#${PLAYERS_ANCHOR}`) scrollToPlayers(false);
  }, []);
  return null;
}
