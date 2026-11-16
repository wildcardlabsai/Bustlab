import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { SettingsProvider } from '@/context/SettingsContext'
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

export default function App() {
  return (
    <SettingsProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
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
    </SettingsProvider>
  )
}
