const KEY = 'beorigo:mine';

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

/** 내가 등록한 글 id 저장 */
export function addMine(id: string): void {
  const ids = read();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(KEY, JSON.stringify(ids));
  }
}

/** "내가 버린 것" 배지 표시용 id 집합 */
export const getMine = (): Set<string> => new Set(read());
