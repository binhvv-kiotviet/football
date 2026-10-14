import { POSITION_LABELS, type Position } from "@/lib/constants";
import { cardTier, STAT_KEYS, statLabels, type Stats } from "@/lib/stats";

const TIER_STYLES = {
  gold: "from-[#fbeaa0] via-[#e2bf55] to-[#b8862a] text-[#3a2a06]",
  silver: "from-[#f3f4f6] via-[#c9cdd3] to-[#9097a0] text-[#1f2328]",
  bronze: "from-[#f0c39a] via-[#c98b55] to-[#94582b] text-[#2d1606]",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const last = parts.at(-1) ?? "";
  const prev = parts.length > 1 ? parts.at(-2)! : "";
  return (prev[0] ?? "") + (last[0] ?? "");
}

export type CardPlayer = { name: string; nickname: string; position: Position; rating: number } & Stats;

/** Thẻ cầu thủ kiểu FIFA: chỉ số tổng, vị trí, 6 chỉ số. */
export function PlayerCard({ p }: { p: CardPlayer }) {
  const tier = cardTier(p.rating);
  const labels = statLabels(p.position);
  const display = p.nickname || p.name.split(/\s+/).at(-1) || p.name;
  return (
    <div
      className={`relative flex flex-col bg-gradient-to-b px-3 pt-3 pb-7 shadow-md ${TIER_STYLES[tier]}`}
      style={{ clipPath: "polygon(0 0, 100% 0, 100% 90%, 50% 100%, 0 90%)", borderRadius: "14px 14px 0 0" }}
      title={`${p.name} – ${POSITION_LABELS[p.position]}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex flex-col items-center leading-none">
          <span className="text-3xl font-bold tabular-nums">{p.rating}</span>
          <span className="mt-1 text-xs font-semibold tracking-wide">{p.position}</span>
        </div>
        <div className="mx-auto mt-1 flex h-14 w-14 items-center justify-center rounded-full bg-black/10 text-lg font-bold uppercase ring-2 ring-black/10">
          {initials(p.name)}
        </div>
        <div className="w-7" />
      </div>
      <div className="mt-2 truncate border-b border-black/15 pb-1 text-center text-sm font-bold uppercase tracking-wide">
        {display}
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
        {STAT_KEYS.map((k) => (
          <div key={k} className="flex items-baseline justify-between gap-1" title={labels[k][1]}>
            <dd className="font-bold tabular-nums">{p[k]}</dd>
            <dt className="font-medium opacity-80">{labels[k][0]}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
