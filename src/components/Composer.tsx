import { useEffect, useState } from 'react';
import type { Category } from '../lib/types';
import { canToss, markTossed, remainingMs } from '../lib/cooldown';

const CATS: { c: Category; label: string }[] = [
  { c: 'emo', label: '감정·기분' },
  { c: 'work', label: '일·고민' },
  { c: 'need', label: '불편·아쉬움' },
];

interface Props {
  onToss: (text: string, category: Category, isPublic: boolean) => void;
}

export default function Composer({ onToss }: Props) {
  const [text, setText] = useState('');
  const [selCat, setSelCat] = useState<Category | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [wait, setWait] = useState(0); // 쿨다운 남은 초

  // 쿨다운 카운트다운
  useEffect(() => {
    if (wait <= 0) return;
    const t = setInterval(() => {
      const left = Math.ceil(remainingMs() / 1000);
      setWait(left > 0 ? left : 0);
    }, 500);
    return () => clearInterval(t);
  }, [wait]);

  function handleToss() {
    const value = text.trim();
    if (!value) return;
    if (!canToss()) {
      setWait(Math.ceil(remainingMs() / 1000));
      return;
    }
    onToss(value, selCat ?? 'emo', isPublic);
    markTossed();
    setText('');
    setSelCat(null);
    setIsPublic(false);
    setWait(Math.ceil(remainingMs() / 1000));
  }

  return (
    <div className="wrap">
      <div className="composer">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="무엇이 마음에 걸리나요? 떠오르는 대로 적어보세요."
          maxLength={400}
        />
        <div className="bar">
          <div className="cats">
            {CATS.map(({ c, label }) => (
              <button
                key={c}
                type="button"
                className={`cat${selCat === c ? ' on' : ''}`}
                onClick={() => setSelCat(selCat === c ? null : c)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="bar" style={{ marginTop: 14 }}>
          <button
            type="button"
            className={`vis${isPublic ? ' public' : ''}`}
            onClick={() => setIsPublic((v) => !v)}
          >
            {isPublic ? '🌙 공개로 버리기 (익명)' : '🔒 그냥 조용히 버리기'}
          </button>
          <div className="toss">
            <button
              type="button"
              className="toss-btn"
              onClick={handleToss}
              disabled={!text.trim() || wait > 0}
            >
              {wait > 0 ? `${wait}초 후` : '버리기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
