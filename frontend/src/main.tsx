import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { queryClient } from './lib/query-client';
import { RootApp } from './RootApp.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <RootApp />
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
