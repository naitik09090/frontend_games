import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import HomeMain from './components/HomeMain.jsx'
// import Stickman from './components/games/stickman.jsx'
import Form from './components/Form.jsx'
// import Doodle_Road from './components/games/DoodleRoad.jsx'
import Login from './components/Login.jsx'
import GamePlayer from './components/games/GamePlayer.jsx'
// import GMGamesList from './components/gm_games/GMGamesList.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'
import DashboardHome from './components/admin/DashboardHome.jsx'
import ManageGames from './components/admin/ManageGames.jsx'
import { useEffect } from 'react'

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
      </main>
    </>
  )
}

export default App
