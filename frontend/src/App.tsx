import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import BookPage from './pages/BookPage'
import BookingConfirmationPage from './pages/BookingConfirmationPage'
import MentorDashboardPage from './pages/MentorDashboardPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<BookPage />} />
        <Route path="booking/:id" element={<BookingConfirmationPage />} />
        <Route path="mentor" element={<MentorDashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
