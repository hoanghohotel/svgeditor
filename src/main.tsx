import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { I18nProvider } from './i18n';
import { ThemeProvider } from './lib/theme';
import { BrowserRouter } from './utils/router';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <I18nProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </I18nProvider>
  </ThemeProvider>
);
