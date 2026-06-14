import type { Toss, Category } from '../lib/types';
import { ago } from '../lib/time';

const CAT_LABEL: Record<Category, string> = {
  emo: '감정·기분',
  work: '일·고민',
  need: '불편·아쉬움',
};

interface Props {
  toss: Toss;
  mine: boolean;
  index: number;
}

export default function FeedItem({ toss, mine, index }: Props) {
  return (
    <div className="item" style={{ animationDelay: `${index * 0.04}s` }}>
      <p className="txt">{toss.text}</p>
      <div className="meta">
        <span className={`tag ${toss.category}`}>{CAT_LABEL[toss.category]}</span>
        <span className="ago">{ago(toss.created_at)}</span>
        {mine && <span className="me">내가 버린 것</span>}
      </div>
    </div>
  );
}
