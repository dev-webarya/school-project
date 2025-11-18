import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import config from './config/config.js';
import { validateContent } from './utils/contentGuard.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

// Run production content validation after initial render
if (config.IS_PRODUCTION) {
  setTimeout(() => validateContent(), 0);
}