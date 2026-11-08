import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthSessionQuery } from '@/features/auth/hooks/useAuthQueries';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { StudioPage } from '@/pages/StudioPage';
import { useAuthStore } from '@/stores/auth.store';

export default function App() {
  useAuthSessionQuery();
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-xs text-zinc-400">
        Đang kiểm tra phiên làm việc...
      </div>
    );
  }

  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={
              user ? <Navigate to="/dashboard" replace /> : <RegisterPage />
            }
          />
          <Route
            path="/dashboard"
            element={
              user ? <DashboardPage /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/studio/:projectId"
            element={user ? <StudioPage /> : <Navigate to="/login" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}
