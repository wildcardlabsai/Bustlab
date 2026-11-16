export type Collection = {
  id: string
  name: string
  slug: string
  description: string | null
  cover_image: string | null
  display_order: number
  active: boolean
  created_at: string
  updated_at: string
}

export type Product = {
  id: string
  name: string
  slug: string
  short_description: string | null
  description: string | null
  category_id: string | null
  main_image: string | null
  gallery_images: string[]
  dimensions: string | null
  material_description: string | null
  ready_to_paint: boolean
  featured: boolean
  shopify_url: string | null
  etsy_url: string | null
  published: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export type CollectionRef = Pick<Collection, 'id' | 'name' | 'slug'>

export type ProductWithCollection = Product & {
  collection: CollectionRef | null
}

export type GalleryImage = {
  id: string
  image_url: string
  caption: string | null
  alt_text: string | null
  collection_id: string | null
  /** True for painted inspiration pieces — never what the customer receives. */
  is_painted_example: boolean
  display_order: number
  published: boolean
  created_at: string
  updated_at: string
}

export type SiteSettings = {
  id: number
  shopify_url: string | null
  etsy_url: string | null
  instagram_url: string | null
  facebook_url: string | null
  tiktok_url: string | null
  youtube_url: string | null
  contact_email: string | null
  logo_url: string | null
  announcement_enabled: boolean
  announcement_text: string | null
  announcement_link: string | null
  hero_image_url: string | null
  footer_tagline: string | null
  updated_at: string
}

export type MessageStatus = 'new' | 'read' | 'archived'

export type ContactMessage = {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: MessageStatus
  created_at: string
}

export type Profile = {
  id: string
  email: string | null
  full_name: string | null
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}
