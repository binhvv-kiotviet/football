"use client";

import { useEffect, useRef, useState } from "react";

/** Nút Chọn tất cả / Bỏ chọn và đếm số người đang tích, đặt bên trong form điểm danh. */
export function AttendanceTools({ total }: { total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState<number | null>(null);

  const boxes = () =>
    Array.from(ref.current?.closest("form")?.querySelectorAll<HTMLInputElement>('input[name="member_id"]') ?? []);

  useEffect(() => {
    const form = ref.current?.closest("form");
    const update = () => setCount(boxes().filter((b) => b.checked).length);
    update();
    form?.addEventListener("change", update);
    return () => form?.removeEventListener("change", update);
  }, []);

  const setAll = (checked: boolean) => {
    boxes().forEach((b) => (b.checked = checked));
    setCount(checked ? total : 0);
  };

  return (
    <div ref={ref} className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn-secondary py-1 text-xs" onClick={() => setAll(true)}>
        ☑ Chọn tất cả
      </button>
      <button type="button" className="btn-secondary py-1 text-xs" onClick={() => setAll(false)}>
        ☐ Bỏ chọn
      </button>
      {count !== null && (
        <span className="text-sm text-muted">
          Đang chọn <b className="text-fg">{count}</b>/{total}
        </span>
      )}
    </div>
  );
}
