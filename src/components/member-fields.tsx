"use client";

import { useState } from "react";
import { isPosition, POSITION_LABELS, POSITIONS, type Position } from "@/lib/constants";
import { overall, STAT_KEYS, statLabels, type Stats } from "@/lib/stats";

type Initial = {
  id: number;
  name: string;
  nickname: string;
  position: Position;
  secondary_position: Position | null;
  active: boolean;
} & Stats;

const DEFAULT_STATS: Stats = { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, phy: 60 };

/** Các ô nhập của form thành viên; nhãn chỉ số đổi theo vị trí, OVR tính trực tiếp. */
export function MemberFields({ m }: { m?: Initial }) {
  const key = m?.id ?? "new";
  const [pos, setPos] = useState<Position>(m?.position ?? "MF");
  const [stats, setStats] = useState<Stats>(m ? { pac: m.pac, sho: m.sho, pas: m.pas, dri: m.dri, def: m.def, phy: m.phy } : DEFAULT_STATS);
  const labels = statLabels(pos);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {m && <input type="hidden" name="id" value={m.id} />}
        <div>
          <label className="label" htmlFor={`name-${key}`}>
            Tên *
          </label>
          <input id={`name-${key}`} name="name" defaultValue={m?.name} required className="input" />
        </div>
        <div>
          <label className="label" htmlFor={`nick-${key}`}>
            Biệt danh (hiển thị khi chia đội)
          </label>
          <input id={`nick-${key}`} name="nickname" defaultValue={m?.nickname} className="input" />
        </div>
        <div>
          <label className="label" htmlFor={`pos-${key}`}>
            Vị trí chính *
          </label>
          <select
            id={`pos-${key}`}
            name="position"
            value={pos}
            onChange={(e) => isPosition(e.target.value) && setPos(e.target.value)}
            className="input"
          >
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {POSITION_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`pos2-${key}`}>
            Vị trí phụ
          </label>
          <select id={`pos2-${key}`} name="secondary_position" defaultValue={m?.secondary_position ?? ""} className="input">
            <option value="">— Không —</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {POSITION_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="label">
          Chỉ số (1–99) · Tổng <b className="text-accent">{overall(pos, stats)}</b>
        </legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {STAT_KEYS.map((k) => (
            <label key={k} className="text-center text-xs">
              <span className="font-semibold">{labels[k][0]}</span>
              <span className="block truncate text-muted">{labels[k][1]}</span>
              <input
                name={k}
                type="number"
                min={1}
                max={99}
                required
                value={stats[k]}
                onChange={(e) => setStats((s) => ({ ...s, [k]: Number(e.target.value) }))}
                className="input mt-1 px-1 text-center"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={m?.active ?? true} className="h-4 w-4 accent-[var(--accent)]" />
        Đang hoạt động
      </label>
    </div>
  );
}
