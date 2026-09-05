import './utils/storage';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safe fallbacks for window.alert and window.confirm in sandboxed iframe environments
if (typeof window !== 'undefined') {
  const nativeAlert = window.alert;
  window.alert = function (message?: any): void {
    try {
      nativeAlert.call(window, message);
    } catch {
      console.info('[Notice]', message);
    }
  };

  const nativeConfirm = window.confirm;
  window.confirm = function (message?: string): boolean {
    try {
      return nativeConfirm.call(window, message);
    } catch {
      return true;
    }
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
