import { useCallback, useEffect, useRef, useState } from 'react';
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

const PAGE = 30; // 한 번에 불러오는 글 수

export default function Home() {
  const [tosses, setTosses] = useState<Toss[]>([]);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [mine, setMine] = useState<Set<string>>(getMine());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(false);

  const [glow, setGlow] = useState({ show: false, message: '', sub: '' });
  const [lastMsg, setLastMsg] = useState(-1);

  // DB에서 실제로 불러온 행 수 (offset). 공개 글 등록 시에도 +1 해서 정렬 어긋남 방지
  const offsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 첫 페이지 로드
  const loadInitial = useCallback(async () => {
    try {
      setError(false);
      const data = await fetchTosses(0, PAGE);
      setTosses(data);
      offsetRef.current = data.length;
      setHasMore(data.length === PAGE);
    } catch (e) {
      console.error('[fetchTosses 실패]', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // 다음 페이지 로드 (무한 스크롤)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = await fetchTosses(offsetRef.current, PAGE);
      offsetRef.current += next.length;
      setTosses((prev) => {
        const seen = new Set(prev.map((t) => t.id));
        return [...prev, ...next.filter((t) => !seen.has(t.id))];
      });
      setHasMore(next.length === PAGE);
    } catch (e) {
      console.error('[loadMore 실패]', e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // 바닥 근처에 닿으면 다음 페이지 자동 로드
  useEffect(() => {
    if (loading || !hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '320px' }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [loading, hasMore, loadMore]);

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

    // 공개·비공개 모두 DB에 저장. 단, 피드/내 글에는 공개 글만 반영
    try {
      const saved = await addToss(text, category, isPublic);
      if (isPublic) {
        addMine(saved.id);
        setMine(getMine());
        setTosses((prev) => [saved, ...prev]);
        offsetRef.current += 1; // 새 글이 DB 맨 앞에 들어가므로 offset 보정
      }
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

      {/* 무한 스크롤 감지점 + 상태 표시 */}
      {!loading && !error && (
        <div className="feed-more wrap" ref={sentinelRef}>
          {loadingMore && <span className="feed-state">더 불러오는 중…</span>}
          {!hasMore && tosses.length > 0 && (
            <span className="feed-state">여기까지가 전부예요.</span>
          )}
        </div>
      )}

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
