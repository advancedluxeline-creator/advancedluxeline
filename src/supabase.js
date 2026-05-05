import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseUrl !== 'https://your-project-id.supabase.co' && supabaseKey && supabaseKey !== 'your-anon-key'
}

export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseKey)
  : {
      // Mock client for local development if keys are missing
      from: (table) => ({
        select: () => ({
          order: () => Promise.resolve({ data: getMockData(table), error: null }),
          single: () => Promise.resolve({ data: getMockData(table)[0], error: null }),
          eq: () => ({ single: () => Promise.resolve({ data: getMockData(table)[0], error: null }) })
        }),
        auth: {
          getSession: () => Promise.resolve({ data: { session: null } }),
          signInWithPassword: () => Promise.resolve({ error: { message: 'Supabase not configured. Please add keys to .env' } }),
          signOut: () => Promise.resolve()
        }
      })
    }

function getMockData(table) {
  const mocks = {
    settings: [
      { key: 'whatsapp_number', value: '250780000000' },
      { key: 'contact_email', value: 'info@crystalview.com' },
      { key: 'address', value: '123 Serenity Blvd, Kigali, Rwanda' },
      { key: 'guest_house_name', value: 'Crystal View Guest House' }
    ],
    rooms: [
      { id: '1', name: 'Deluxe Room', price: 25000, description: 'Premium comfort with a view.', image_urls: ['/assets/room-deluxe.png'], features: ['Free WiFi', 'TV', 'Bathroom'] },
      { id: '2', name: 'Standard Room', price: 15000, description: 'Cozy and affordable.', image_urls: ['/assets/room-deluxe.png'], features: ['Free WiFi', 'Comfortable Bed'] }
    ],
    events: [
      { id: '1', title: 'Wedding Promotion', date: 'June 2026', description: '20% off for summer weddings.', image_url: '/assets/event-wedding.png' }
    ],
    hero_slides: [
      { id: '1', image_url: '/assets/hero.png', title: 'Welcome to Crystal View', subtitle: 'Your Luxury Escape' }
    ]
  }
  return mocks[table] || []
}
