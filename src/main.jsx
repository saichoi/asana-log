import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AsanaProvider } from './context/AsanaContext.jsx';
import { initSync } from './sync/syncEngine.js';
import App from './App.jsx';
import './styles.css';

function start() {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <AsanaProvider>
        <App />
      </AsanaProvider>
    </StrictMode>,
  );
}

// Google 에서 돌아온 주소 처리와 첫 동기화는 화면을 그리기 전에 시작한다.
// 만료된 연결을 되살리러 곧 Google 에 다녀올 거라면 화면을 그리지 않고 기다린다.
// (이동이 어떤 이유로든 일어나지 않으면 잠시 뒤 그냥 연다)
Promise.resolve(initSync()).then((leaving) => {
  if (leaving) setTimeout(start, 5000);
  else start();
});
