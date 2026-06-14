import { supabase } from './supabase';
import { seed } from './seed';
import type { Toss, Category } from './types';

// 더미 모드에서 등록한 글을 세션 동안 유지
let memory: Toss[] = [...seed];

/** 최신 공개 글 50개 조회 */
export async function fetchTosses(): Promise<Toss[]> {
  if (!supabase) return memory;

  const { data, error } = await supabase
    .from('tosses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as Toss[];
}

/** 공개 글 등록 (비공개는 호출하지 않음) */
export async function addToss(text: string, category: Category): Promise<Toss> {
  if (!supabase) {
    const toss: Toss = {
      id: crypto.randomUUID(),
      text,
      category,
      created_at: new Date().toISOString(),
    };
    memory = [toss, ...memory];
    return toss;
  }

  const { data, error } = await supabase
    .from('tosses')
    .insert({ text, category })
    .select()
    .single();

  if (error) throw error;
  return data as Toss;
}
