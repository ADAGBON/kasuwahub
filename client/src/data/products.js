// Static UI reference data. Products now come from the API (GET /api/products).

export const categories = [
  { slug: 'ankara', name: 'Ankara', blurb: 'Bold wax prints, sold by the yard' },
  { slug: 'aso-oke', name: 'Aso-Oke', blurb: 'Hand-woven Yoruba cloth for big days' },
  { slug: 'lace', name: 'Lace', blurb: 'Cord, French & Swiss lace for owambe' },
  { slug: 'adire', name: 'Adire', blurb: 'Indigo resist-dyed from Abeokuta' },
  { slug: 'ready-made', name: 'Ready-Made', blurb: 'Tailored outfits, ready to wear' },
  { slug: 'accessories', name: 'Accessories', blurb: 'Gele, caps, beads and bags' },
]

export const deliveryZones = [
  { id: 'island', name: 'Lagos Island', areas: 'VI, Ikoyi, Lekki, Ajah', fee: 3500 },
  { id: 'mainland', name: 'Lagos Mainland', areas: 'Yaba, Surulere, Ikeja, Ogba', fee: 2500 },
  { id: 'outskirts', name: 'Outskirts', areas: 'Ikorodu, Badagry, Epe', fee: 5000 },
]

export const getCategory = (slug) => categories.find((c) => c.slug === slug)

export const FABRICS = ['ankara', 'aso-oke', 'lace', 'adire']

// Decorative artwork for the auth pages
export const showcaseFabric = { name: 'Ankara fabric', pattern: 'circles', palette: ['#d4572a', '#e8a33d', '#1f2a5c'] }
