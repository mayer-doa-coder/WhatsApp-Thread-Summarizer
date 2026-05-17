import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';
import NavBar from './components/NavBar';
import PrivateRoute from './components/PrivateRoute';
import UploadPage from './pages/UploadPage';
import SummaryPage from './pages/SummaryPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HistoryPage from './pages/HistoryPage';
import DailyBriefPage from './pages/DailyBriefPage';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <NavBar />
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/summary" element={<SummaryPage />} />
            <Route path="/daily-brief" element={<DailyBriefPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<PrivateRoute />}>
              <Route path="/history" element={<HistoryPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <ToastContainer />
      </AuthProvider>
    </ToastProvider>
  );
}
