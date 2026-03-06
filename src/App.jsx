import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'

// Lazy-load ALL routes so each page only downloads the JS it actually needs.
// Lighthouse was flagging 25.8 KiB of unused JS because HomeMain + GamePlayer
// were eagerly bundled together — GamePlayer was unused on the home page and
// vice versa.
const HomeMain = lazy(() => import('./components/HomeMain.jsx'))
const GamePlayer = lazy(() => import('./components/games/GamePlayer.jsx'))
const Login = lazy(() => import('./components/Login.jsx'))
const Form = lazy(() => import('./components/Form.jsx'))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout.jsx'))
const DashboardHome = lazy(() => import('./components/admin/DashboardHome.jsx'))
const ManageGames = lazy(() => import('./components/admin/ManageGames.jsx'))

// Minimal loading fallback while lazy chunks download
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f0c29' }}>
    <div className="spinner-border text-light" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
)

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
            <Route path='/admin/login' element={<Login />} />

            {/* Public Routes */}
            <Route path='/' element={<HomeMain />} />
            <Route path='/game' element={<HomeMain />} />
            {/* <Route path='/gm-games' element={<GMGamesList />} /> */}
            <Route path='/game/:id' element={<GamePlayer />} />

            {/* Admin / Protected Routes */}
            <Route path='/add-game' element={
              <ProtectedRoute>
                <Form />
              </ProtectedRoute>
            } />

            {/* Admin Dashboard Routes */}
            <Route path='/admin' element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardHome />} />
              <Route path="games" element={<ManageGames />} />
            </Route>

          </Routes>
        </Suspense>
      </main>
    </>
  )
}

export default App

