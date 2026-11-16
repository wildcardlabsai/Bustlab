/**
 * Starter content. Used in two places:
 *  1. As the public site's read-only fallback when Supabase is not configured (local preview).
 *  2. To generate supabase/seed.sql (scripts/generate-seed.ts) so a fresh database starts with the same content.
 *
 * All images are original placeholder renders of BUSTLAB-style sculpts and are replaceable in the admin.
 * No prices, stock levels or physical specifications are invented — dimensions are left empty until
 * real measurements are entered in the admin.
 */
import type { Collection, GalleryImage, Product, SiteSettings } from '../types/content'

const T = '2026-01-01T00:00:00.000Z'
const img = (path: string) => `/images/${path}`

export const demoCollections: Collection[] = [
  {
    id: '6a1b2c3d-0001-4000-8000-000000000001',
    name: 'Sci-Fi & Future',
    slug: 'sci-fi-future',
    description: 'Armoured helmets, synthetic beings and deep-space explorers — futuristic busts with crisp panel lines and hard-surface detail.',
    cover_image: img('collections/sci-fi-future-1200.webp'),
    display_order: 1,
    active: true,
    created_at: T,
    updated_at: T,
  },
  {
    id: '6a1b2c3d-0001-4000-8000-000000000002',
    name: 'Gaming & Fantasy',
    slug: 'gaming-fantasy',
    description: 'Warlords, knights and heroes of the realm — gaming-inspired fantasy busts built for bold display and dramatic paint schemes.',
    cover_image: img('collections/gaming-fantasy-1200.webp'),
    display_order: 2,
    active: true,
    created_at: T,
    updated_at: T,
  },
  {
    id: '6a1b2c3d-0001-4000-8000-000000000003',
    name: 'Horror & Dark Art',
    slug: 'horror-dark-art',
    description: 'Demons, revenants and gothic nightmares — dark-art busts with deep recesses made for shadows, washes and weathering.',
    cover_image: img('collections/horror-dark-art-1200.webp'),
    display_order: 3,
    active: true,
    created_at: T,
    updated_at: T,
  },
  {
    id: '6a1b2c3d-0001-4000-8000-000000000004',
    name: 'Heroes & Legends',
    slug: 'heroes-legends',
    description: 'Superhero-inspired champions and mythic legends — original designs with powerful poses and iconic silhouettes.',
    cover_image: img('collections/heroes-legends-1200.webp'),
    display_order: 4,
    active: true,
    created_at: T,
    updated_at: T,
  },
  {
    id: '6a1b2c3d-0001-4000-8000-000000000005',
    name: 'Original Creations',
    slug: 'original-creations',
    description: 'Characters you will only find at BUSTLAB — our own original designs, from masked wanderers to brand-new worlds.',
    cover_image: img('collections/original-creations-1200.webp'),
    display_order: 5,
    active: true,
    created_at: T,
    updated_at: T,
  },
]

const [scifi, gaming, horror, heroes, originals] = demoCollections.map((c) => c.id)
const MATERIAL = 'Supplied unpainted in a neutral finish, ready for priming and painting. Paints and tools are not included.'

interface DemoProductInput {
  n: number
  name: string
  slug: string
  category: string
  featured: boolean
  short: string
  description: string
}

const productInputs: DemoProductInput[] = [
  {
    n: 1, name: 'Vanguard Mk II', slug: 'vanguard-mk-ii', category: scifi, featured: true,
    short: 'An armoured sci-fi trooper helmet with a wraparound visor and layered shoulder plates.',
    description:
      'The Vanguard Mk II is a hard-surface sci-fi bust built around a sculpted wraparound visor, side comms modules and a raised helmet crest. Layered pauldrons and a ribbed chin guard give painters plenty of panels to pick out — from clean military schemes to battle-worn weathering.',
  },
  {
    n: 2, name: 'Nova Unit-07', slug: 'nova-unit-07', category: scifi, featured: true,
    short: 'A sleek synthetic android with a segmented neck and armoured face plate.',
    description:
      'Nova Unit-07 pairs smooth synthetic surfaces with mechanical detail: a segmented neck assembly, recessed optic band and sculpted sensor fins. A striking piece for metallic finishes, glowing optics or a pristine lab-white scheme.',
  },
  {
    n: 3, name: 'Abyss Diver', slug: 'abyss-diver', category: scifi, featured: true,
    short: 'A heavy dome dive helmet with portholes, riveted collar and trailing hoses.',
    description:
      'The Abyss Diver is a retro-futuristic dive helmet bust featuring three framed portholes, a riveted collar ring and sculpted air hoses. Ideal for brass and verdigris effects, rust and grime, or a sleek deep-space recolour.',
  },
  {
    n: 4, name: 'Iron Warden', slug: 'iron-warden', category: gaming, featured: true,
    short: 'A fantasy great-helm knight with layered pauldrons and a sculpted crest.',
    description:
      'Iron Warden is a fantasy knight bust with a flat-topped great helm, pierced breathing holes, a tall crest and stacked pauldrons. Built for true-metal techniques, heraldic colours or a battered, mud-splattered finish.',
  },
  {
    n: 5, name: 'Tuskborn Warchief', slug: 'tuskborn-warchief', category: gaming, featured: false,
    short: 'A tusked warlord with a spiked crest, fur mantle and spiked shoulder armour.',
    description:
      'The Tuskborn Warchief is a gaming-inspired fantasy bust with a heavy brow, curved tusks, a spiked crest and a thick mantle across the shoulders. Plenty of texture for skin tones, fur and scarred armour.',
  },
  {
    n: 6, name: 'Thornhorn', slug: 'thornhorn', category: horror, featured: true,
    short: 'A horned demon bust with sweeping horns, spined back and spiked shoulders.',
    description:
      'Thornhorn is a dark-art demon bust with sweeping tapered horns, a spined crest and ridged chest plating. Deep recesses make it perfect for dramatic shading, glowing eyes and fiery colour transitions.',
  },
  {
    n: 7, name: 'The Revenant', slug: 'the-revenant', category: horror, featured: false,
    short: 'A hooded gothic figure with a skull face and a heavy draped cloak.',
    description:
      'The Revenant is a gothic horror bust featuring a deep hood framing a skull face, a draped cloak and a ringed clasp. A great canvas for bone tones, cloth highlights and atmospheric shadow work.',
  },
  {
    n: 8, name: 'Lich Sovereign', slug: 'lich-sovereign', category: horror, featured: false,
    short: 'A crowned undead sovereign with a spiked collar and ribbed chest.',
    description:
      'The Lich Sovereign is an undead ruler bust with a spiked crown, a fan of collar spines and a ribbed chest. Suits aged bone, tarnished gold and eerie glow effects.',
  },
  {
    n: 9, name: 'Aegis Paragon', slug: 'aegis-paragon', category: heroes, featured: false,
    short: 'An original winged-helm champion with a high cape collar and chest emblem.',
    description:
      'Aegis Paragon is an original superhero-inspired bust with a winged helm, half-face mask, high cape collar and an angular chest emblem. Made for bold primary colours, metallic wings or your own hero design.',
  },
  {
    n: 10, name: 'Masked Ronin', slug: 'masked-ronin', category: originals, featured: false,
    short: 'An original masked wanderer with a lower face guard, headband and layered shoulder lames.',
    description:
      'The Masked Ronin is a BUSTLAB original: a masked wanderer with a ridged face guard, tied headband, topknot and layered shoulder armour. Ideal for lacquered finishes, weathered cloth and fine freehand detail.',
  },
]

export const demoProducts: Product[] = productInputs.map((p) => ({
  id: `6a1b2c3d-0002-4000-8000-${String(p.n).padStart(12, '0')}`,
  name: p.name,
  slug: p.slug,
  short_description: p.short,
  description: p.description,
  category_id: p.category,
  main_image: img(`products/${p.slug}-1-1600.webp`),
  gallery_images: [img(`products/${p.slug}-2-1600.webp`), img(`products/${p.slug}-3-1600.webp`)],
  dimensions: null,
  material_description: MATERIAL,
  ready_to_paint: true,
  featured: p.featured,
  shopify_url: null,
  etsy_url: null,
  published: true,
  display_order: p.n,
  created_at: new Date(Date.parse(T) + p.n * 86_400_000).toISOString(),
  updated_at: T,
}))

let galleryOrder = 0
const g = (n: number, path: string, caption: string, alt: string, collection: string | null, painted = false): GalleryImage => ({
  id: `6a1b2c3d-0003-4000-8000-${String(n).padStart(12, '0')}`,
  image_url: img(path),
  caption,
  alt_text: alt,
  collection_id: collection,
  is_painted_example: painted,
  display_order: ++galleryOrder,
  published: true,
  created_at: T,
  updated_at: T,
})

export const demoGallery: GalleryImage[] = [
  g(1, 'products/vanguard-mk-ii-1-1600.webp', 'Vanguard Mk II — as supplied, unpainted', 'Unpainted grey Vanguard Mk II sci-fi helmet bust on a display pedestal', scifi),
  g(2, 'painted/vanguard-painted-1600.webp', 'Vanguard Mk II — painted inspiration example', 'Vanguard Mk II bust painted in navy, bone and orange as an inspiration example', scifi, true),
  g(3, 'products/thornhorn-1-1600.webp', 'Thornhorn — as supplied, unpainted', 'Unpainted grey horned demon bust with sweeping horns', horror),
  g(4, 'products/iron-warden-3-1600.webp', 'Iron Warden — helm detail', 'Close-up of the unpainted Iron Warden great helm', gaming),
  g(5, 'painted/thornhorn-painted-1600.webp', 'Thornhorn — painted inspiration example', 'Thornhorn demon bust painted in deep red with bone horns as an inspiration example', horror, true),
  g(6, 'products/abyss-diver-2-1600.webp', 'Abyss Diver — side profile', 'Side view of the unpainted Abyss Diver dive helmet bust', scifi),
  g(7, 'products/masked-ronin-1-1600.webp', 'Masked Ronin — as supplied, unpainted', 'Unpainted grey masked ronin bust with headband', originals),
  g(8, 'painted/diver-painted-1600.webp', 'Abyss Diver — painted inspiration example', 'Abyss Diver bust painted in brass and teal as an inspiration example', scifi, true),
  g(9, 'products/the-revenant-1-1600.webp', 'The Revenant — as supplied, unpainted', 'Unpainted hooded gothic skull bust', horror),
  g(10, 'products/aegis-paragon-1-1600.webp', 'Aegis Paragon — as supplied, unpainted', 'Unpainted winged-helm champion bust', heroes),
  g(11, 'painted/warden-painted-1600.webp', 'Iron Warden — painted inspiration example', 'Iron Warden knight bust painted with steel and gold as an inspiration example', gaming, true),
  g(12, 'products/tuskborn-warchief-1-1600.webp', 'Tuskborn Warchief — as supplied, unpainted', 'Unpainted tusked warchief bust with spiked crest', gaming),
  g(13, 'products/nova-unit-07-3-1600.webp', 'Nova Unit-07 — face detail', 'Close-up of the unpainted Nova Unit-07 android head', scifi),
  g(14, 'products/lich-sovereign-1-1600.webp', 'Lich Sovereign — as supplied, unpainted', 'Unpainted crowned lich bust', horror),
]

export const demoSettings: SiteSettings = {
  id: 1,
  shopify_url: null,
  etsy_url: null,
  instagram_url: null,
  facebook_url: null,
  tiktok_url: null,
  youtube_url: null,
  contact_email: null,
  logo_url: null,
  announcement_enabled: true,
  announcement_text: 'Every BUSTLAB bust is supplied unpainted and ready to paint.',
  announcement_link: '/ready-to-paint',
  hero_image_url: null,
  footer_tagline: 'Premium collectible busts and sculptures, supplied ready to paint.',
  updated_at: T,
}
