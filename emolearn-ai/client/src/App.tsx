import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { Navbar } from './components/layout/Navbar'
import Dashboard from './pages/Dashboard'
import SignLanguage from './pages/SignLanguage'
import Analytics from './pages/Analytics'
import Dictionary from './pages/Dictionary'
import Profile from './pages/Profile'
import Teacher from './pages/Teacher'
import Login from './pages/Login'
import Register from './pages/Register'
import LiveChat from './pages/LiveChat'
import GlobalBiometrics from './components/GlobalBiometrics'
import { useUserStore } from './store/userStore'

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, role } = useUserStore()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  return (
    <>
      {role === 'student' && <GlobalBiometrics />}
      <div className="flex min-h-screen bg-bg-primary">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}

function RoleRedirect() {
  const { role } = useUserStore()
  return <Navigate to={role === 'teacher' ? '/teacher' : '/dashboard'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedLayout><RoleRedirect /></ProtectedLayout>} />
        
        {/* Student Routes */}
        <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/sign-language" element={<ProtectedLayout><SignLanguage /></ProtectedLayout>} />
        <Route path="/analytics" element={<ProtectedLayout><Analytics /></ProtectedLayout>} />
        <Route path="/dictionary" element={<ProtectedLayout><Dictionary /></ProtectedLayout>} />
        <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
        <Route path="/live-chat" element={<ProtectedLayout><LiveChat /></ProtectedLayout>} />
        
        {/* Teacher Routes */}
        <Route path="/teacher" element={<ProtectedLayout><Teacher /></ProtectedLayout>} />
      </Routes>
    </BrowserRouter>
  )
}
