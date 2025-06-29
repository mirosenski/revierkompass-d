import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'
import App from './App.tsx'

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Initialize app
const initializeApp = () => {
  // Set initial theme based on system preference
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  }

  // Set app metadata
  document.title = 'RevierKompass - Polizei Baden-Württemberg';
  
  // Set favicon and meta tags
  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (favicon) {
    favicon.href = '/favicon.ico';
  }

  const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
  if (metaDescription) {
    metaDescription.content = 'RevierKompass - Professionelle Routing-Anwendung für die Polizei Baden-Württemberg. Präzise Navigation zu allen 158 Polizeistationen mit Multi-Provider Routing-Technologie.';
  }

  // Add meta viewport for mobile optimization
  const metaViewport = document.createElement('meta');
  metaViewport.name = 'viewport';
  metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  document.head.appendChild(metaViewport);

  // Add meta for PWA
  const metaThemeColor = document.createElement('meta');
  metaThemeColor.name = 'theme-color';
  metaThemeColor.content = '#1e40af';
  document.head.appendChild(metaThemeColor);

  console.log('🚓 RevierKompass - Polizei Baden-Württemberg');
  console.log('🎯 Präzise Routing-Technologie initialisiert');
  console.log('🌍 Baden-Württemberg Fokus aktiviert');
  console.log('⚡ Multi-Provider Routing bereit');
};

// Initialize the app
initializeApp();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
