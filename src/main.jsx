import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AsanaProvider } from './context/AsanaContext.jsx';
import { initSync } from './sync/syncEngine.js';
import App from './App.jsx';
import './styles.css';

// Google 에서 돌아온 주소 처리와 첫 동기화는 화면을 그리기 전에 시작한다.
initSync();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AsanaProvider>
      <App />
    </AsanaProvider>
  </StrictMode>,
);
