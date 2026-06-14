import type { Category } from '../lib/types';

export type FilterValue = 'all' | Category;

const FILTERS: { f: FilterValue; label: string }[] = [
  { f: 'all', label: '전체' },
  { f: 'emo', label: '감정·기분' },
  { f: 'work', label: '일·고민' },
  { f: 'need', label: '불편·아쉬움' },
];

interface Props {
  filter: FilterValue;
  onChange: (f: FilterValue) => void;
}

export default function Filters({ filter, onChange }: Props) {
  return (
    <div className="filters wrap">
      {FILTERS.map(({ f, label }) => (
        <button
          key={f}
          type="button"
          className={`filt${filter === f ? ' on' : ''}`}
          onClick={() => onChange(f)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
