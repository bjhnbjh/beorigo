import type { Toss } from '../lib/types';
import type { FilterValue } from './Filters';
import FeedItem from './FeedItem';

interface Props {
  tosses: Toss[];
  filter: FilterValue;
  mine: Set<string>;
  loading: boolean;
  error: boolean;
}

export default function Feed({ tosses, filter, mine, loading, error }: Props) {
  const visible = tosses.filter((t) => filter === 'all' || t.category === filter);

  let body;
  if (loading) {
    body = <p className="feed-state">불러오는 중…</p>;
  } else if (error) {
    body = <p className="feed-state">잠시 후 다시 시도해 주세요.</p>;
  } else if (visible.length === 0) {
    body = <p className="feed-state">아직 버려진 마음이 없어요.</p>;
  } else {
    body = visible.map((t, i) => (
      <FeedItem key={t.id} toss={t} mine={mine.has(t.id)} index={i} />
    ));
  }

  return <div className="feed wrap">{body}</div>;
}
