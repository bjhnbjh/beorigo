import { supabase } from './supabase';
import { seed } from './seed';
import type { Toss, Category } from './types';

// 더미 모드에서 등록한 글을 세션 동안 유지
let memory: Toss[] = [...seed];

/**
 * 최신 공개 글을 페이지 단위로 조회 (무한 스크롤용).
 * 비공개 글은 RLS상 조회되지 않음.
 * @param offset 건너뛸 개수 (이미 불러온 개수)
 * @param limit  한 번에 가져올 개수
 */
export async function fetchTosses(offset = 0, limit = 30): Promise<Toss[]> {
  if (!supabase) {
    return memory.filter((t) => t.is_public).slice(offset, offset + limit);
  }

  const { data, error } = await supabase
    .from('tosses')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data ?? []) as Toss[];
}

/**
 * 글 등록. 공개·비공개 모두 DB에 저장한다.
 * - 공개: insert 후 저장된 행을 돌려받아 피드에 즉시 반영
 * - 비공개: RLS(읽기=공개만) 때문에 insert 후 되읽기가 막히므로
 *   .select() 없이 저장만 하고, 반환값은 클라이언트에서 구성
 */
export async function addToss(
  text: string,
  category: Category,
  isPublic: boolean
): Promise<Toss> {
  if (!supabase) {
    const toss: Toss = {
      id: crypto.randomUUID(),
      text,
      category,
      is_public: isPublic,
      created_at: new Date().toISOString(),
    };
    memory = [toss, ...memory];
    return toss;
  }

  if (isPublic) {
    const { data, error } = await supabase
      .from('tosses')
      .insert({ text, category, is_public: true })
      .select()
      .single();

    if (error) throw error;
    return data as Toss;
  }

  const { error } = await supabase
    .from('tosses')
    .insert({ text, category, is_public: false });

  if (error) throw error;
  return {
    id: crypto.randomUUID(),
    text,
    category,
    is_public: false,
    created_at: new Date().toISOString(),
  };
}
