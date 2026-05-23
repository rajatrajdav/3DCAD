import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getSession } from './auth'
import Landing from './pages/landing'
import Login from './pages/login'
import Register from './pages/register'
import ProjectBrowser from './pages/projectbrowser'
import CADEditor from './pages/CADEditor'
import Setting from './pages/setting'
import ViewOnly from './pages/viewonly'

// Redirects to /login if not authenticated
function PrivateRoute({ children }) {
  return getSession() ? children : <Navigate to="/login" replace />
}

// Redirects to /projects if already logged in (for login/register pages)
function PublicOnlyRoute({ children }) {
  return getSession() ? <Navigate to="/projects" replace /> : children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login"    element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

        {/* Protected */}
        <Route path="/projects"  element={<PrivateRoute><ProjectBrowser /></PrivateRoute>} />
        <Route path="/cad/:id"   element={<PrivateRoute><CADEditor /></PrivateRoute>} />
        <Route path="/view/:id"  element={<PrivateRoute><ViewOnly /></PrivateRoute>} />
        <Route path="/settings"  element={<PrivateRoute><Setting /></PrivateRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
