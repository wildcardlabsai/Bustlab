import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SettingsProvider } from '@/context/SettingsContext'
import { PurchaseLinks } from '@/components/product/PurchaseLinks'
import { ProductCard } from '@/components/product/ProductCard'
import { Logo } from '@/components/brand/Logo'
import { demoProducts } from '@/data/demo'

const wrap = (ui: React.ReactNode) => render(<MemoryRouter><SettingsProvider>{ui}</SettingsProvider></MemoryRouter>)

describe('PurchaseLinks', () => {
  it('hides purchase buttons when no store URL is configured', async () => {
    wrap(<PurchaseLinks product={{ ...demoProducts[0], shopify_url: null, etsy_url: null }} />)
    expect(await screen.findByText(/coming soon/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /shopify|etsy/i })).toBeNull()
  })
  it('renders safe new-tab links for product URLs and ignores unsafe ones', async () => {
    wrap(<PurchaseLinks product={{ ...demoProducts[0], shopify_url: 'https://shop.example.com/p/1', etsy_url: 'javascript:alert(1)' }} />)
    const link = await screen.findByRole('link', { name: /on Shopify/i })
    expect(link).toHaveAttribute('href', 'https://shop.example.com/p/1')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByRole('link', { name: /etsy/i })).toBeNull()
  })
})

describe('ProductCard', () => {
  it('shows name, category, READY TO PAINT label and details link, never a price', () => {
    const p = { ...demoProducts[0], collection: { id: 'c', name: 'Sci-Fi & Future', slug: 'sci-fi-future' } }
    const { container } = wrap(<ProductCard product={p} />)
    expect(screen.getByText('Vanguard Mk II')).toBeInTheDocument()
    expect(screen.getByText('Sci-Fi & Future')).toBeInTheDocument()
    expect(screen.getByText(/ready to paint/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Vanguard Mk II' })).toHaveAttribute('href', '/products/vanguard-mk-ii')
    expect(container.textContent).not.toMatch(/[£$€]\s?\d/)
  })
})

describe('Logo', () => {
  it('renders the built-in wordmark or an uploaded logo', () => {
    const { rerender } = render(<Logo />)
    expect(screen.getByRole('img', { name: 'BUSTLAB' }).tagName.toLowerCase()).toBe('svg')
    rerender(<Logo src="https://cdn.example.com/logo.png" />)
    expect(screen.getByRole('img', { name: 'BUSTLAB' })).toHaveAttribute('src', 'https://cdn.example.com/logo.png')
  })
})
