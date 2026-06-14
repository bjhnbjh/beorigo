import type { Toss } from './types';

const minAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

// 더미 모드(Supabase 미연결)에서 보여줄 샘플 글
export const seed: Toss[] = [
  { id: 's1', text: '회의에서 한 말이 자꾸 마음에 걸린다. 괜히 그렇게 말했나 싶어서 계속 곱씹게 돼.', category: 'work', created_at: minAgo(0) },
  { id: 's2', text: 'AI한테 뭘 시키고 싶은데 프롬프트를 어떻게 써야 할지 모르겠어. 매번 원하는 답이 안 나와.', category: 'need', created_at: minAgo(3) },
  { id: 's3', text: '다들 앞으로 나아가는 것 같은데 나만 제자리인 것 같아서 불안해.', category: 'emo', created_at: minAgo(11) },
  { id: 's4', text: '앱마다 회원가입이 너무 귀찮다. 그냥 한 번에 되면 좋겠는데.', category: 'need', created_at: minAgo(24) },
  { id: 's5', text: '친구한테 서운한 게 있는데 말하자니 옹졸해 보일까 봐 그냥 삼켰어.', category: 'emo', created_at: minAgo(38) },
  { id: 's6', text: '할 일은 많은데 뭐부터 해야 할지 모르겠어서 결국 아무것도 못 했다.', category: 'work', created_at: minAgo(60) },
];
