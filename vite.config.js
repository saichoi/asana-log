import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages 는 https://saichoi.github.io/asana-log/ 처럼 하위 경로에서 열리므로
// 배포용 빌드에서만 base 를 저장소 이름으로 맞춘다. (개발 서버는 그대로 / 에서 열림)
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/asana-log/' : '/',
  plugins: [react()],
}));
