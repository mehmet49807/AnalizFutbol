import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FirebaseProvider } from './lib/FirebaseProvider';
import { NotificationProvider } from './components/Notification';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </FirebaseProvider>
  </StrictMode>,
);
