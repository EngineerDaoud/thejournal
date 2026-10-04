import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation, useNavigationType } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'

// Every page except the home page is loaded on demand, so a visitor only
// downloads the code for the page they open (the admin editor is the heaviest).
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Author = lazy(() => import('./pages/Author'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const EditorialPolicy = lazy(() => import('./pages/EditorialPolicy'))
const ImageCredits = lazy(() => import('./pages/ImageCredits'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const Disclaimer = lazy(() => import('./pages/Disclaimer'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminEditor = lazy(() => import('./pages/AdminEditor'))
const AdminCategories = lazy(() => import('./pages/AdminCategories'))
const AdminComments = lazy(() => import('./pages/AdminComments'))
const NotFound = lazy(() => import('./pages/NotFound'))

// A single-page site keeps the old scroll position when the page changes, so a
// link clicked in the footer would open the new page scrolled to the bottom.
// This puts every newly opened page back at the very top. (The browser's Back
// button is left alone so it can still return you to where you were.)
function ScrollToTop() {
  const { pathname, search } = useLocation()
  const navType = useNavigationType()

  useEffect(() => {
    if (navType === 'POP') return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, search, navType])

  return null
}

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Navbar />
      <main style={{ minHeight: '60vh' }}>
        <Suspense fallback={<div className="container" style={{ paddingTop: 60 }}>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/author/:name" element={<Author />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/editorial-policy" element={<EditorialPolicy />} />
          <Route path="/image-credits" element={<ImageCredits />} />
          <Route path="/privacy-policy" element={<Privacy />} />
          <Route path="/terms-and-conditions" element={<Terms />} />
          <Route path="/disclaimer" element={<Disclaimer />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/new"
            element={
              <ProtectedRoute>
                <AdminEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute>
                <AdminCategories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/comments"
            element={
              <ProtectedRoute>
                <AdminComments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/edit/:id"
            element={
              <ProtectedRoute>
                <AdminEditor />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      <Footer />
    </AuthProvider>
  )
}