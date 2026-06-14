const KEY = 'beorigo:lastToss';
const COOLDOWN_MS = 3 * 60 * 1000; // 3분

/** 다음 등록까지 남은 시간(ms). 0이면 등록 가능 */
export function remainingMs(): number {
  const last = Number(localStorage.getItem(KEY) ?? 0);
  return Math.max(0, COOLDOWN_MS - (Date.now() - last));
}

export const canToss = (): boolean => remainingMs() === 0;

export const markTossed = (): void =>
  localStorage.setItem(KEY, String(Date.now()));
