/**
 * Supabase schema typings (mirrors supabase/migrations). Regenerate with
 * `npx supabase gen types typescript --linked > src/types/database.ts` if preferred.
 */
import type { Collection, ContactMessage, GalleryImage, Product, Profile, SiteSettings } from './content'

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
type AutoCols = 'id' | 'created_at' | 'updated_at'

type Table<Row, Insert, Rel = []> = {
  Row: Row
  Insert: Insert
  Update: Partial<Insert>
  Relationships: Rel
}

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, Optional<Profile, 'created_at' | 'updated_at' | 'role' | 'email' | 'full_name'>>
      collections: Table<Collection, Optional<Collection, AutoCols | 'display_order' | 'active' | 'description' | 'cover_image'>>
      products: Table<
        Product,
        Optional<
          Product,
          | AutoCols
          | 'short_description' | 'description' | 'category_id' | 'main_image' | 'gallery_images' | 'dimensions'
          | 'material_description' | 'ready_to_paint' | 'featured' | 'shopify_url' | 'etsy_url' | 'published' | 'display_order'
        >,
        [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'collections'
            referencedColumns: ['id']
          },
        ]
      >
      gallery_images: Table<
        GalleryImage,
        Optional<GalleryImage, AutoCols | 'caption' | 'alt_text' | 'collection_id' | 'is_painted_example' | 'display_order' | 'published'>,
        [
          {
            foreignKeyName: 'gallery_images_collection_id_fkey'
            columns: ['collection_id']
            isOneToOne: false
            referencedRelation: 'collections'
            referencedColumns: ['id']
          },
        ]
      >
      site_settings: Table<SiteSettings, Partial<SiteSettings>>
      contact_messages: Table<ContactMessage, Optional<ContactMessage, 'id' | 'created_at' | 'status'>>
    }
    Views: { [_ in never]: never }
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
