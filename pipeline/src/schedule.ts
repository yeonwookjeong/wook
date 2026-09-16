import type { ChannelConfig } from './types.js';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
const KST_OFFSET_MIN = 9 * 60; // Asia/Seoul 은 서머타임이 없으므로 고정 오프셋으로 안전하다.

export interface Slot {
  day: number; // 0=일
  hour: number;
  minute: number;
}

export function parseSlots(cfg: ChannelConfig): Slot[] {
  const slots: Slot[] = [];
  for (const raw of cfg.publish.slots) {
    const m = /^([A-Z]{3})\s+(\d{1,2}):(\d{2})$/.exec(raw.trim());
    if (!m) continue; // "DAILY manual" 같은 수동 표기는 건너뛴다.
    const day = DAYS.indexOf(m[1] as (typeof DAYS)[number]);
    if (day < 0) continue;
    slots.push({ day, hour: Number(m[2]), minute: Number(m[3]) });
  }
  return slots;
}

/** KST 기준 벽시계로 변환한 Date (getUTC* 로 읽으면 KST 값이 나온다). */
function toKst(d: Date): Date {
  return new Date(d.getTime() + KST_OFFSET_MIN * 60_000);
}

function kstIso(y: number, mo: number, d: number, h: number, mi: number): string {
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(y, 4)}-${p(mo)}-${p(d)}T${p(h)}:${p(mi)}:00+09:00`;
}

/**
 * 이미 잡힌 시각(taken)을 피해 다음 빈 발행 슬롯을 찾는다.
 * 슬롯이 없는 채널(수동 발행)이면 null.
 */
export function nextFreeSlot(
  cfg: ChannelConfig,
  taken: Iterable<string> = [],
  from: Date = new Date(),
): string | null {
  const slots = parseSlots(cfg);
  if (slots.length === 0) return null;

  const busy = new Set(taken);
  // 최소 2시간 뒤부터 잡는다 — 검토·렌더 시간을 남긴다.
  const start = toKst(new Date(from.getTime() + 2 * 3600_000));

  for (let offset = 0; offset < 120; offset++) {
    const probe = new Date(start.getTime() + offset * 86400_000);
    const y = probe.getUTCFullYear();
    const mo = probe.getUTCMonth() + 1;
    const d = probe.getUTCDate();
    const dow = probe.getUTCDay();

    for (const slot of slots.filter((s) => s.day === dow).sort(byTime)) {
      const iso = kstIso(y, mo, d, slot.hour, slot.minute);
      if (busy.has(iso)) continue;
      // 오늘 날짜라면 이미 지난 시각은 건너뛴다.
      if (offset === 0) {
        const minutesNow = start.getUTCHours() * 60 + start.getUTCMinutes();
        if (slot.hour * 60 + slot.minute < minutesNow) continue;
      }
      return iso;
    }
  }
  return null;
}

function byTime(a: Slot, b: Slot): number {
  return a.hour * 60 + a.minute - (b.hour * 60 + b.minute);
}

/** publishAt 이 지났는지 (발행 워크플로의 판정 기준). */
export function isDue(publishAt: string | undefined, now: Date = new Date()): boolean {
  if (!publishAt) return false;
  const t = Date.parse(publishAt);
  return Number.isFinite(t) && t <= now.getTime();
}
