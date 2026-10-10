# KasuwaHub 🛍️

> Online marketplace for Lagos fashion & fabric sellers — Lab Phase project (draft)

**Status:** ✅ Phase 1 (Front-end UI) complete · Phase 2 (Back end) next

![KasuwaHub home page](docs/screenshots/desktop-home.png)

## About

KasuwaHub is a full-stack e-commerce platform for Lagos fashion and fabric sellers, built with React, Node.js/Express and MongoDB. Customers can browse Ankara, Aso-Oke and ready-made outfits, manage a cart, and pay securely in Naira via Paystack, with Lagos zone-based delivery fees. An admin dashboard handles product management and order fulfilment.

## Problem

Many Lagos fashion and fabric businesses sell mainly through Instagram DMs and WhatsApp — no proper catalog, manual bank-transfer confirmations, and no way for customers to track orders. KasuwaHub gives these sellers a complete online storefront.

## Planned Features

- [ ] User registration & login (JWT)
- [x] Product catalog with category, price filters and search (UI)
- [x] Product detail pages (fabrics by the yard, outfits by size)
- [x] Persistent shopping cart (localStorage; synced to API in Phase 2)
- [ ] Checkout with Lagos delivery zones (Island / Mainland / Outskirts)
- [ ] Paystack payments (test mode) with webhook verification
- [ ] Customer order history & status tracking
- [ ] Admin dashboard — product CRUD, image upload, order status updates

## Tech Stack

| Layer | Technology |
|---|---|
| Front end | React 18, Vite, React Router 6, Tailwind CSS 4 |
| Back end | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT, bcrypt |
| Images | Cloudinary |
| Payments | Paystack |
| Hosting | Vercel (client), Render (API) |

## Project Structure

```
kasuwahub/
├── client/     # React front end
│   └── src/
│       ├── components/  # Navbar, SearchBar, ProductCard, FabricArt, Footer…
│       ├── pages/       # Home, Shop, ProductDetail, Cart, Login, Register
│       ├── context/     # CartContext (localStorage)
│       └── data/        # mock catalogue → replaced by API in Phase 2
├── server/     # Express API
├── docs/       # Wireframes, API spec, pitch deck
└── README.md
```

## Roadmap

| Phase | Focus | Status |
|---|---|---|
| 1 | Front-end Development — UI Design | ✅ Done |
| 2 | Back-end Development — API, auth, products, orders | ⬜ Not started |
| 3 | Deployment & Testing | ⬜ Not started |
| 4 | Pitch & Presentation | ⬜ Not started |

## Phase 1 — Front-end UI

| Objective | What was built |
|---|---|
| **1. Layout — home & product pages** | Home (hero, value props, category tiles, trending, promo banner, ready-to-wear, delivery zones), Shop/catalogue, Product detail (gallery, size picker for outfits, yard quantity for fabrics with minimums, seller info, related items), Cart, Sign in, Register, 404 |
| **2. Navigation & search** | Sticky navbar with active links, mobile slide-out menu, cart badge. Search bar with live suggestions (keyboard ↑ ↓ Enter / Esc), results page at `/shop?q=…`. Filters by category, price band and custom ₦ range; sorting by popularity, price and rating — all kept in the URL so results are shareable |
| **3. Styling** | Tailwind CSS v4 with a custom theme (indigo, terracotta, mustard on cream; Fraunces + Manrope). Fabric artwork is generated SVG, so no stock photos are needed until Cloudinary uploads arrive in Phase 2 |
| **4. Responsive testing** | Tested with Playwright at 375px (phone), 768px (tablet) and 1440px (desktop) on every route: no horizontal overflow, mobile menu & filter drawer work, add-to-cart / size validation / delivery-zone totals verified. Screenshots in [`docs/screenshots`](docs/screenshots) |

Cart is persisted in `localStorage`. Checkout, login and register show front-end validation only; they connect to the Express API and Paystack in Phase 2.

| Phone | Tablet | Mobile filters |
|---|---|---|
| ![](docs/screenshots/phone-product.png) | ![](docs/screenshots/tablet-shop.png) | ![](docs/screenshots/phone-filters.png) |

## Run locally

```bash
cd client
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in client/dist
```

Deploy the client to Vercel with **Root Directory = `client`** (`vercel.json` handles client-side routes).

## Team

- Lawrence Adagbon — [@ADAGBON](https://github.com/ADAGBON)

## License

MIT
