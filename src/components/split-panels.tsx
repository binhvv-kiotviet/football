"use client";

import { useState } from "react";

/**
 * Hai khối trên cùng một màn hình.
 * Màn hình rộng: chia đôi trái/phải. Điện thoại: chuyển qua lại bằng tab.
 */
export function SplitPanels({
  left,
  right,
  leftLabel,
  rightLabel,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  leftLabel: React.ReactNode;
  rightLabel: React.ReactNode;
}) {
  const [tab, setTab] = useState<"left" | "right">("left");
  const tabCls = (active: boolean) =>
    `flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${active ? "bg-surface shadow-sm" : "text-muted"}`;
  const panelCls = "@container min-w-0";

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-lg border border-line bg-bg p-1 lg:hidden" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "left"}
          className={tabCls(tab === "left")}
          onClick={() => setTab("left")}
        >
          {leftLabel}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "right"}
          className={tabCls(tab === "right")}
          onClick={() => setTab("right")}
        >
          {rightLabel}
        </button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className={`${panelCls} ${tab === "left" ? "" : "hidden lg:block"}`}>{left}</div>
        <div className={`${panelCls} ${tab === "right" ? "" : "hidden lg:block"}`}>{right}</div>
      </div>
    </div>
  );
}
