import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { SettingsProvider } from '@/context/SettingsContext'
import { AuthProvider } from '@/context/AuthContext'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { PageLoader } from '@/components/ui/States'
import Home from '@/pages/Home'
import NotFound from '@/pages/NotFound'

const Collections = lazy(() => import('@/pages/Collections'))
const CollectionDetail = lazy(() => import('@/pages/CollectionDetail'))
const ProductDetail = lazy(() => import('@/pages/ProductDetail'))
const Gallery = lazy(() => import('@/pages/Gallery'))
const ReadyToPaint = lazy(() => import('@/pages/ReadyToPaint'))
const About = lazy(() => import('@/pages/About'))
const Contact = lazy(() => import('@/pages/Contact'))

// Admin (separate chunks — never downloaded by regular visitors)
const AdminShell = lazy(() => import('@/admin/AdminShell'))
const AdminLogin = lazy(() => import('@/admin/pages/Login'))
const AdminOverview = lazy(() => import('@/admin/pages/Overview'))
const AdminProducts = lazy(() => import('@/admin/pages/Products'))
const AdminProductEditor = lazy(() => import('@/admin/pages/ProductEditor'))
const AdminCollections = lazy(() => import('@/admin/pages/Collections'))
const AdminGallery = lazy(() => import('@/admin/pages/Gallery'))
const AdminMessages = lazy(() => import('@/admin/pages/Messages'))
const AdminSettings = lazy(() => import('@/admin/pages/Settings'))

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="admin" element={<AdminShell />}>
            <Route index element={<AdminOverview />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductEditor />} />
            <Route path="products/:id" element={<AdminProductEditor />} />
            <Route path="collections" element={<AdminCollections />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="collections" element={<Collections />} />
            <Route path="collections/:slug" element={<CollectionDetail />} />
            <Route path="products/:slug" element={<ProductDetail />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="ready-to-paint" element={<ReadyToPaint />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
      </AuthProvider>
    </SettingsProvider>
  )
}
