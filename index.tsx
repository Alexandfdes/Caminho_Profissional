import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './AppRouter';
import { ErrorBoundary } from './components/ErrorBoundary';

import './styles/cv-editor-tokens.css';
import './styles/print.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  </React.StrictMode>
);
