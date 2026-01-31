import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import HomePage from './pages/HomePage';
import InteractivePage from './pages/InteractivePage';
import ThemesPage from './pages/ThemesPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />
          <Route path="interactive" element={<InteractivePage />} />
          <Route path="themes" element={<ThemesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
