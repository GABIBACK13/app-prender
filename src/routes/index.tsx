import { Navigate, Route, Routes } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import WelcomePage from '../pages/Welcome/WelcomePage'
import LoginPage from '../pages/Login/LoginPage'
import SignInPage from '../pages/SignIn/SignInPage'
import MainPage from '../pages/Main/MainPage'
import PlayPage from '../pages/Play/PlayPage'
import OnboardingPage from '../pages/Onboarding/OnboardingPage'
import ProfilePage from '../pages/Profile/ProfilePage'
import { ShopPage } from '../pages/Shop/ShopPage'
import { ShopManagePage } from '../pages/Shop/ShopManagePage'
import MainLayout from '../components/Layout/MainLayout'
import PrivacyPolicyPage from '../pages/Privacy/PrivacyPolicyPage'
import type { ReactNode } from 'react'

function LoadingScreen() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <CircularProgress size={48} />
    </Box>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/" replace />
  // onboarded === false (não undefined) significa conta nova ainda sem placement quiz
  if (user.onboarded === false) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to={user.onboarded === false ? '/onboarding' : '/main'} replace />
  return <>{children}</>
}

/** Rota acessível apenas para usuários autenticados que ainda não concluíram o onboarding. */
function OnboardingRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/" replace />
  if (user.onboarded !== false) return <Navigate to="/main" replace />
  return <>{children}</>
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicOnlyRoute>
            <WelcomePage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/sign-in"
        element={
          <PublicOnlyRoute>
            <SignInPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <OnboardingPage />
          </OnboardingRoute>
        }
      />
      <Route
        path="/main"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MainPage />} />
        <Route path="jogar" element={<PlayPage />} />
        <Route path="loja" element={<ShopPage />} />
        <Route path="loja/gerenciar" element={<ShopManagePage />} />
        <Route path="perfil" element={<ProfilePage />} />
      </Route>
      <Route path="/privacidade" element={<PrivacyPolicyPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
