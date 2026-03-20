import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { Navbar } from './components/layout/Navbar'
import Dashboard from './pages/Dashboard'
import SignLanguage from './pages/SignLanguage'
import Analytics from './pages/Analytics'
import Dictionary from './pages/Dictionary'
import Profile from './pages/Profile'
import Teacher from './pages/Teacher'
import TeacherTests from './pages/TeacherTests'
import TeacherAnalytics from './pages/TeacherAnalytics'
import Login from './pages/Login'
import Register from './pages/Register'
import Landing from './pages/Landing'
import AITutor from './pages/AITutor'
import LiveChat from './pages/LiveChat'
import VideoTranslate from './pages/VideoTranslate'
import Tests from './pages/Tests'
import GlobalBiometrics from './components/GlobalBiometrics'
import NotificationToast from './components/NotificationToast'
import { useEffect } from 'react'
import { useUserStore } from './store/userStore'
import { registerUser } from './lib/socket'

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, role, id } = useUserStore()

  useEffect(() => {
    if (isLoggedIn && id) registerUser(id)
  }, [isLoggedIn, id])

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
          <main className="flex-1 p-3 md:p-6 overflow-auto pb-20 md:pb-6">
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

function LandingOrApp() {
  const { isLoggedIn, role } = useUserStore()
  if (isLoggedIn) return <Navigate to={role === 'teacher' ? '/teacher' : '/dashboard'} replace />
  return <Landing />
}

export default function App() {
  return (
    <BrowserRouter>
      <NotificationToast />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingOrApp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Student Routes */}
        <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/sign-language" element={<ProtectedLayout><SignLanguage /></ProtectedLayout>} />
        <Route path="/analytics" element={<ProtectedLayout><Analytics /></ProtectedLayout>} />
        <Route path="/dictionary" element={<ProtectedLayout><Dictionary /></ProtectedLayout>} />
        <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
        <Route path="/ai-tutor" element={<ProtectedLayout><AITutor /></ProtectedLayout>} />
        <Route path="/live-chat" element={<ProtectedLayout><LiveChat /></ProtectedLayout>} />
        <Route path="/video-translate" element={<ProtectedLayout><VideoTranslate /></ProtectedLayout>} />
        <Route path="/tests" element={<ProtectedLayout><Tests /></ProtectedLayout>} />

        {/* Teacher Routes */}
        <Route path="/teacher" element={<ProtectedLayout><Teacher /></ProtectedLayout>} />
        <Route path="/teacher/tests" element={<ProtectedLayout><TeacherTests /></ProtectedLayout>} />
        <Route path="/teacher/analytics" element={<ProtectedLayout><TeacherAnalytics /></ProtectedLayout>} />
      </Routes>
    </BrowserRouter>
  )
}
