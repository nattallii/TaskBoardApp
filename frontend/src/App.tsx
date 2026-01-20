import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, AuthRedirect } from './components/ProtectedRoute'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/RegisterPage'
import { BoardsPage } from './pages/BoardsPage'
import { BoardDetailPage } from './pages/BoardDetailPage'
import { ProfilePage } from './pages/ProfilePage'
import { AppShell } from './components/AppShell'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <AuthRedirect>
              <LoginPage />
            </AuthRedirect>
          }
        />
        <Route
          path="/register"
          element={
            <AuthRedirect>
              <RegisterPage />
            </AuthRedirect>
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/boards" element={<BoardsPage />} />
            <Route path="/boards/:id" element={<BoardDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
