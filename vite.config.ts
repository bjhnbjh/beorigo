import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // NEXT_PUBLIC_ 접두사 변수도 브라우저에 노출 허용 (Supabase 기본 이름 그대로 사용)
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
});
