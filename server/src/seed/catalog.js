// Starter catalogue for the database seed (same items the Phase 1 UI used)

export const catalog = [
  {
    id: 'ank-001', name: 'Sunburst Ankara Print', category: 'ankara', price: 4500, unit: 'yard',
    minQty: 2, stock: 40, seller: 'Mama Tobi Fabrics', location: 'Balogun Market', rating: 4.8, reviews: 126,
    pattern: 'circles', palette: ['#d4572a', '#e8a33d', '#1f2a5c'], badge: 'Bestseller',
    description: '100% cotton wax print with a vivid sunburst motif. Colour-fast and perfect for dresses, shirts and two-piece sets.',
  },
  {
    id: 'ank-002', name: 'Royal Diamond Ankara', category: 'ankara', price: 5200, unit: 'yard',
    minQty: 2, stock: 40, seller: 'Mama Tobi Fabrics', location: 'Balogun Market', rating: 4.6, reviews: 84,
    pattern: 'diamonds', palette: ['#1f2a5c', '#e8a33d', '#faf5ec'],
    description: 'Premium Dutch-style wax print with an interlocking diamond pattern in royal blue and gold.',
  },
  {
    id: 'ank-003', name: 'Palm Wave Ankara', category: 'ankara', price: 3800, unit: 'yard',
    minQty: 2, stock: 40, seller: 'Iya Basira Textiles', location: 'Oshodi', rating: 4.4, reviews: 51,
    pattern: 'waves', palette: ['#2f6b4f', '#e8a33d', '#faf5ec'],
    description: 'Soft-hand cotton print with flowing palm-green waves. Great for casual Friday shirts.',
  },
  {
    id: 'aso-001', name: 'Wine & Gold Aso-Oke (Set)', category: 'aso-oke', price: 65000, unit: 'set',
    minQty: 1, stock: 40, seller: 'Iseyin Weavers Co-op', location: 'Ikeja', rating: 4.9, reviews: 42,
    pattern: 'stripes', palette: ['#7a1e2c', '#e8a33d', '#3b0d15'], badge: 'Handwoven',
    description: 'Complete set: buba, iro, gele and ipele. Hand-woven in Iseyin with metallic gold thread.',
  },
  {
    id: 'aso-002', name: 'Sky Blue Aso-Oke Fila & Gele', category: 'aso-oke', price: 28000, unit: 'set',
    minQty: 1, stock: 40, seller: 'Iseyin Weavers Co-op', location: 'Ikeja', rating: 4.7, reviews: 19,
    pattern: 'stripes', palette: ['#5b8fc9', '#faf5ec', '#1f2a5c'],
    description: 'Matching cap (fila) and head-tie (gele) for couples and wedding aso-ebi.',
  },
  {
    id: 'lac-001', name: 'Champagne Cord Lace', category: 'lace', price: 38000, unit: 'piece',
    minQty: 1, stock: 40, seller: 'Lekki Lace House', location: 'Lekki', rating: 4.8, reviews: 67, badge: 'New',
    pattern: 'lace', palette: ['#e9d8b4', '#b89a5e', '#faf5ec'],
    description: '5-yard piece of heavy cord lace with beaded detailing. Ideal for owambe and engagements.',
  },
  {
    id: 'lac-002', name: 'Emerald French Lace', category: 'lace', price: 45000, unit: 'piece',
    minQty: 1, stock: 40, seller: 'Lekki Lace House', location: 'Lekki', rating: 4.5, reviews: 23,
    pattern: 'lace', palette: ['#2f6b4f', '#a7d1b5', '#14301f'],
    description: '5-yard piece of soft French lace with stone embellishment, lined and ready to sew.',
  },
  {
    id: 'adi-001', name: 'Indigo Adire Eleko', category: 'adire', price: 6000, unit: 'yard',
    minQty: 2, stock: 40, seller: 'Itoku Dye Works', location: 'Yaba', rating: 4.7, reviews: 58,
    pattern: 'adire', palette: ['#1b2a63', '#8fa7d9', '#0e1638'],
    description: 'Starch-resist adire hand-dyed in natural indigo. Every yard is unique.',
  },
  {
    id: 'adi-002', name: 'Rust Tie-Dye Adire', category: 'adire', price: 5500, unit: 'yard',
    minQty: 2, stock: 40, seller: 'Itoku Dye Works', location: 'Yaba', rating: 4.3, reviews: 31,
    pattern: 'adire', palette: ['#b0441e', '#f1c38e', '#5c1f0b'],
    description: 'Tie-dye adire in warm rust tones. Lightweight cotton, perfect for kaftans.',
  },
  {
    id: 'rdy-001', name: "Men's Ankara Kaftan", category: 'ready-made', price: 22000, unit: 'piece',
    minQty: 1, stock: 40, sizes: ['S', 'M', 'L', 'XL', 'XXL'], seller: 'Stitch Republic', location: 'Surulere',
    rating: 4.6, reviews: 74, pattern: 'diamonds', palette: ['#1f2a5c', '#d4572a', '#faf5ec'], garment: 'kaftan', badge: 'Bestseller',
    description: 'Tailored kaftan with embroidered neckline and side pockets. Matching trousers included.',
  },
  {
    id: 'rdy-002', name: 'Ankara Flare Midi Dress', category: 'ready-made', price: 18500, unit: 'piece',
    minQty: 1, stock: 40, sizes: ['XS', 'S', 'M', 'L', 'XL'], seller: 'Adunni Couture', location: 'Yaba',
    rating: 4.8, reviews: 112, pattern: 'circles', palette: ['#e8a33d', '#d4572a', '#2f6b4f'], garment: 'dress',
    description: 'Fitted bodice, flared skirt, invisible back zip. Fully lined for comfort in Lagos heat.',
  },
  {
    id: 'rdy-003', name: 'Senator Native Set', category: 'ready-made', price: 35000, unit: 'piece',
    minQty: 1, stock: 40, sizes: ['M', 'L', 'XL', 'XXL'], seller: 'Stitch Republic', location: 'Surulere',
    rating: 4.9, reviews: 46, pattern: 'plain', palette: ['#2c2c2c', '#e8a33d', '#111111'], garment: 'kaftan',
    description: 'Crisp senator top and trousers in premium cashmere-blend with gold button detail.',
  },
  {
    id: 'rdy-004', name: 'Adire Boubou Gown', category: 'ready-made', price: 27000, unit: 'piece',
    minQty: 1, stock: 40, sizes: ['S', 'M', 'L', 'XL'], seller: 'Adunni Couture', location: 'Yaba',
    rating: 4.5, reviews: 28, pattern: 'adire', palette: ['#1b2a63', '#8fa7d9', '#0e1638'], garment: 'dress', badge: 'New',
    description: 'Free-flowing boubou in hand-dyed adire. One relaxed silhouette, flattering on everyone.',
  },
  {
    id: 'acc-001', name: 'Pre-Tied Auto Gele', category: 'accessories', price: 9500, unit: 'piece',
    minQty: 1, stock: 40, seller: 'Gele by Kemi', location: 'Ikorodu', rating: 4.7, reviews: 90,
    pattern: 'stripes', palette: ['#e8a33d', '#d4572a', '#faf5ec'],
    description: 'Ready-to-wear gele — no tying skills needed. Adjustable band fits all head sizes.',
  },
  {
    id: 'acc-002', name: 'Coral Bead Necklace Set', category: 'accessories', price: 15000, unit: 'piece',
    minQty: 1, stock: 40, seller: 'Benin Bead Gallery', location: 'Lagos Island', rating: 4.6, reviews: 37,
    pattern: 'beads', palette: ['#c23b2a', '#e8a33d', '#faf5ec'],
    description: 'Necklace, bracelet and earrings in faux coral beads. Classic bridal and traditional look.',
  },
  {
    id: 'acc-003', name: 'Ankara Tote Bag', category: 'accessories', price: 7000, unit: 'piece',
    minQty: 1, stock: 40, seller: 'Adunni Couture', location: 'Yaba', rating: 4.4, reviews: 22,
    pattern: 'waves', palette: ['#d4572a', '#1f2a5c', '#faf5ec'],
    description: 'Structured tote with leather handles and inner zip pocket, made from Ankara offcuts.',
  },
]

