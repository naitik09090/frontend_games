import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'

// Lazy-load ALL routes so each page only downloads the JS it actually needs.
const HomeMain = lazy(() => import('./components/HomeMain.jsx'))
const GamePlayer = lazy(() => import('./components/games/GamePlayer.jsx'))
const Login = lazy(() => import('./components/Login.jsx'))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout.jsx'))
const DashboardHome = lazy(() => import('./components/admin/DashboardHome.jsx'))
const ManageGames = lazy(() => import('./components/admin/ManageGames.jsx'))

import GameLoader from './components/games/GameLoader'

// Minimal loading fallback while lazy chunks download
const PageLoader = () => <GameLoader type="viewport" />;

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

function App() {
  useEffect(() => {
    if (typeof document !== "undefined") {
      const noSelectElements = document.querySelectorAll(".no-select");
      noSelectElements.forEach((el) => {
        el.style.userSelect = "none";
      });
    }
  }, []);

  return (
    <>
      <main id="main-content" className="no-select">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path='/' element={<HomeMain />} />
            <Route path='/game' element={<HomeMain />} />
            <Route path='/game/:id' element={<GamePlayer />} />

            {/* Admin Login */}
            <Route path='/admin/login' element={<Login />} />

            {/* Admin Dashboard Routes (Protected) */}
            <Route path='/admin' element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardHome />} />
              <Route path="games" element={<ManageGames />} />
            </Route>

            {/* Fallback for unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </>
  )
}

export default App
