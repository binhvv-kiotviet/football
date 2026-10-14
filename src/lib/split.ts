import type { Position } from "./constants";

export type SplitPlayer = { id: number; position: Position; rating: number };

const FIELD_ORDER: Position[] = ["DF", "MF", "FW"];

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function totals(teams: SplitPlayer[][]) {
  return teams.map((t) => t.reduce((s, p) => s + p.rating, 0));
}

function spread(teams: SplitPlayer[][]) {
  const t = totals(teams);
  return Math.max(...t) - Math.min(...t);
}

/**
 * Một phương án ngẫu nhiên nhưng đã cân bằng sẵn:
 * mỗi đội tối đa 1 thủ môn (thủ môn dư đá như tiền vệ), từng vị trí rải đều, số người chênh tối đa 1.
 */
function randomBalanced(players: SplitPlayer[], teamCount: number): SplitPlayer[][] {
  const teams: SplitPlayer[][] = Array.from({ length: teamCount }, () => []);
  const countPos = (i: number, pos: Position) => teams[i].filter((p) => p.position === pos).length;

  const gks = shuffle(players.filter((p) => p.position === "GK"));
  shuffle(teams.map((_, i) => i))
    .slice(0, gks.length)
    .forEach((teamIdx, k) => teams[teamIdx].push(gks[k]));
  const extraGks = gks.slice(teamCount);

  for (const pos of FIELD_ORDER) {
    const group = shuffle([...players.filter((p) => p.position === pos), ...(pos === "MF" ? extraGks : [])]);
    for (const p of group) {
      // Chọn ngẫu nhiên trong các đội đang ít người nhất, rồi ít người cùng vị trí nhất
      const minSize = Math.min(...teams.map((t) => t.length));
      const bySize = teams.map((_, i) => i).filter((i) => teams[i].length === minSize);
      const minPos = Math.min(...bySize.map((i) => countPos(i, pos)));
      const options = bySize.filter((i) => countPos(i, pos) === minPos);
      teams[options[Math.floor(Math.random() * options.length)]].push(p);
    }
  }
  return teams;
}

/**
 * Đổi chéo cầu thủ cùng vị trí (thử theo thứ tự ngẫu nhiên) cho tới khi độ lệch ≤ `target`
 * hoặc không giảm được nữa. Dừng sớm ở mức "đủ tốt" để các phương án khác nhau thật sự.
 */
function improveUntil(teams: SplitPlayer[][], target: number) {
  for (let guard = 0; guard < 500 && spread(teams) > target; guard++) {
    const current = spread(teams);
    const swaps: [number, number, number, number][] = [];
    for (let a = 0; a < teams.length; a++)
      for (let b = a + 1; b < teams.length; b++)
        for (let i = 0; i < teams[a].length; i++)
          for (let j = 0; j < teams[b].length; j++)
            if (teams[a][i].position === teams[b][j].position && teams[a][i].rating !== teams[b][j].rating)
              swaps.push([a, i, b, j]);
    let improved = false;
    for (const [a, i, b, j] of shuffle(swaps)) {
      const pa = teams[a][i];
      teams[a][i] = teams[b][j];
      teams[b][j] = pa;
      if (spread(teams) < current - 1e-9) {
        improved = true;
        break;
      }
      teams[b][j] = teams[a][i];
      teams[a][i] = pa;
    }
    if (!improved) break;
  }
  return teams;
}

function signature(ids: number[][]) {
  return ids
    .map((t) => [...t].sort((a, b) => a - b).join(","))
    .sort()
    .join("|");
}

const toIds = (teams: SplitPlayer[][]) => teams.map((t) => t.map((p) => p.id));

/** Độ khác nhau giữa 2 phương án: số cặp cầu thủ trước cùng đội nay khác đội (hoặc ngược lại). Không phụ thuộc màu đội. */
function distance(a: number[][], b: number[][]) {
  const teamOf = (teams: number[][]) => new Map(teams.flatMap((t, i) => t.map((id) => [id, i] as const)));
  const ta = teamOf(a);
  const tb = teamOf(b);
  const ids = [...ta.keys()];
  let d = 0;
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++)
      if ((ta.get(ids[i]) === ta.get(ids[j])) !== (tb.get(ids[i]) === tb.get(ids[j]))) d++;
  return d;
}

/**
 * Chia đội cân bằng:
 * 1. Mỗi đội 1 thủ môn (nếu đủ), từng vị trí rải đều, số người các đội chênh nhau tối đa 1.
 * 2. Tổng điểm các đội lệch nhau không quá mức "gần tốt nhất" (tốt nhất tìm được + ~1% tổng điểm một đội).
 * 3. Trong các phương án đạt yêu cầu, chọn ngẫu nhiên trong nhóm khác đội hình hiện tại (`current`) nhiều nhất,
 *    để mỗi lần bấm "chia lại" ra đội khác hẳn.
 */
export function splitTeams(players: SplitPlayer[], teamCount: number, current?: number[][]): number[][] {
  const currentSig = current ? signature(current) : null;

  // Ước lượng mức lệch tốt nhất có thể
  let best = improveUntil(randomBalanced(players, teamCount), 0);
  for (let i = 0; i < 20; i++) {
    const t = improveUntil(randomBalanced(players, teamCount), 0);
    if (spread(t) < spread(best)) best = t;
  }
  const avgTeamTotal = players.reduce((s, p) => s + p.rating, 0) / teamCount;
  const target = spread(best) + Math.max(4, avgTeamTotal * 0.01);

  // Gom nhiều phương án khác nhau đạt yêu cầu
  const options = new Map<string, number[][]>();
  for (let i = 0; i < 150; i++) {
    const t = improveUntil(randomBalanced(players, teamCount), target);
    if (spread(t) <= target + 1e-9) {
      const ids = toIds(t);
      options.set(signature(ids), ids);
    }
  }
  options.set(signature(toIds(best)), toIds(best));

  let pool = [...options.entries()].filter(([sig]) => sig !== currentSig).map(([, ids]) => ids);
  if (pool.length === 0) pool = [...options.values()];
  if (current && pool.length > 1) {
    // Giữ 1/3 phương án khác đội hiện tại nhiều nhất
    pool = pool
      .map((ids) => ({ ids, d: distance(current, ids) }))
      .sort((x, y) => y.d - x.d)
      .slice(0, Math.max(1, Math.ceil(pool.length / 3)))
      .map((x) => x.ids);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
