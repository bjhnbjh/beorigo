import { useMemo } from 'react';

/** 배경 별 파티클 (30개) */
export default function Stars() {
  const stars = useMemo(
    () =>
      Array.from({ length: 30 }, () => {
        const size = Math.random() * 3 + 1.5;
        return {
          width: `${size}px`,
          height: `${size}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDuration: `${Math.random() * 8 + 7}s`,
          animationDelay: `${Math.random() * 8}s`,
        };
      }),
    [],
  );

  return (
    <div className="stars" aria-hidden="true">
      {stars.map((style, i) => (
        <div key={i} className="star" style={style} />
      ))}
    </div>
  );
}
