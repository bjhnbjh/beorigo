import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer>
      <p>버리고 · 담아두지 말고 버리고 가세요</p>
      <p className="foot-links">
        <Link to="/terms">이용약관</Link> · <Link to="/privacy">개인정보처리방침</Link> ·{' '}
        문의/신고 <a href="mailto:pok2026003@gmail.com">pok2026003@gmail.com</a>
      </p>
      <p className="foot-help">
        혼자 견디기 힘들다면 — 자살예방상담 <b>109</b> · 정신건강상담 <b>1577-0199</b>
      </p>
    </footer>
  );
}
