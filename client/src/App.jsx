import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DownloadProvider } from './context/DownloadContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DownloadProvider>
          <AppRoutes />
        </DownloadProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

