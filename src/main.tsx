import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { pwaService } from './services/pwa/pwaService'

import { ErrorBoundary } from './components/common/ErrorBoundary'

// Register PWA service worker for production offline shell support
pwaService.registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
