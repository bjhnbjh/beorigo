import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

/** ISO 시간 → "3분 전" 같은 한국어 상대시간 */
export const ago = (iso: string) =>
  formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ko });
