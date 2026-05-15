import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import SummaryPage from './pages/SummaryPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/summary" element={<SummaryPage />} />
      </Routes>
    </BrowserRouter>
  );
}
