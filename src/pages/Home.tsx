import { useCallback, useEffect, useState } from 'react';
import Stars from '../components/Stars';
import Header from '../components/Header';
import Composer from '../components/Composer';
import Filters, { type FilterValue } from '../components/Filters';
import Feed from '../components/Feed';
import Afterglow from '../components/Afterglow';
import Footer from '../components/Footer';
import { fetchTosses, addToss } from '../lib/db';
import { addMine, getMine } from '../lib/mine';
import type { Toss, Category } from '../lib/types';

const MESSAGES = [
  '잘 버렸어요.',
  '오늘은 여기까지만.',
  '내려놓아 줘서 고마워요.',
  '그 마음, 잘 보냈어요.',
  '가벼워져도 괜찮아요.',
  '수고했어요, 오늘도.',
];

export default function Home() {
  const [tosses, setTosses] = useState<Toss[]>([]);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [mine, setMine] = useState<Set<string>>(getMine());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [glow, setGlow] = useState({ show: false, message: '', sub: '' });
  const [lastMsg, setLastMsg] = useState(-1);

  const load = useCallback(async () => {
    try {
      setError(false);
      const data = await fetchTosses();
      setTosses(data);
    } catch (e) {
      console.error('[fetchTosses 실패]', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToss(text: string, category: Category, isPublic: boolean) {
    // afterglow 메시지 (직전과 다르게)
    let n = lastMsg;
    while (n === lastMsg) n = Math.floor(Math.random() * MESSAGES.length);
    setLastMsg(n);
    setGlow({
      show: true,
      message: MESSAGES[n],
      sub: isPublic ? '누군가 당신의 마음에 공감할 거예요.' : '조금 가벼워지셨길 바라요.',
    });

    // 비공개("조용히 버리기")는 저장하지 않음
    if (!isPublic) return;

    try {
      const saved = await addToss(text, category);
      addMine(saved.id);
      setMine(getMine());
      setTosses((prev) => [saved, ...prev]);
    } catch (e) {
      console.error('[addToss 실패]', e);
      setError(true);
    }
  }

  return (
    <>
      <Stars />
      <Header />
      <Composer onToss={handleToss} />

      <div className="feed-head wrap">
        <h2>사람들이 버린 마음</h2>
        <span className="note">공개로 버린 것만 익명으로 보여요</span>
      </div>
      <Filters filter={filter} onChange={setFilter} />
      <Feed tosses={tosses} filter={filter} mine={mine} loading={loading} error={error} />

      <Footer />

      <Afterglow
        show={glow.show}
        message={glow.message}
        sub={glow.sub}
        onClose={() => setGlow((g) => ({ ...g, show: false }))}
      />
    </>
  );
}
