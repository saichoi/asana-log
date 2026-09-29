import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AsanaProvider } from './context/AsanaContext.jsx';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AsanaProvider>
      <App />
    </AsanaProvider>
  </StrictMode>,
);
