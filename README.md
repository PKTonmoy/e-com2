# PRELUX — Luxury E‑Commerce (MERN)

PRELUX is a premium, fully responsive luxury commerce experience built with MongoDB, Express, React, and Node. It ships with elegant light/dark themes, JWT auth, cart/checkout flow, admin console (products, orders, users, content, analytics), editorial blog, and curated demo data.

## Stack
- Backend: Node, Express, MongoDB (Mongoose), JWT, bcrypt, express-validator, rate limiting, Socket.io.
- Frontend: React (Vite), React Router, React Query, TailwindCSS, Recharts, Zustand.
- Testing: Jest/Supertest (backend), Vitest (frontend placeholder).

## Setup
1) Install dependencies  
```bash
cd backend && npm install
cd ../frontend && npm install
```

2) Environment  
Create `backend/.env` (use your values):
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/prelux
JWT_SECRET=change-me
CLIENT_URL=http://localhost:5173
STRIPE_SECRET=test_mode
EMAIL_FROM=hello@prelux.lux
SOCKET_ORIGIN=http://localhost:5173
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

3) Seed demo data  
```bash
cd backend
npm run seed
```
Seeds: 12+ luxury products (from `seed.json`), admin user `admin@prelux.lux` / `admin123`, sample customer/order, coupon `PRELUX10`, one blog post.

4) Run
```bash
# backend
cd backend && npm run dev
# frontend
cd frontend && npm run dev
```
Visit http://localhost:5173

## Deployment
- Backend: Render/Fly/DigitalOcean droplet. Set env vars above. Ensure `PORT` exposed; enable persistent storage for MongoDB or use Atlas.
- Frontend: Vercel/Netlify. Set `VITE_API_URL` to deployed API URL. Run `npm run build`.
- Optional: add Docker Compose (Mongo + API + frontend) — not included by default.

## API Overview
- Auth: `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`.
- Products: `GET /api/products`, `GET /api/products/:slug`, admin CRUD `POST/PUT/DELETE /api/products`.
- Cart: `GET/PUT /api/cart`, `POST /api/cart/merge`.
- Orders: `POST /api/orders`, `GET /api/orders/mine`, admin `GET /api/admin/orders`, `PUT /api/orders/:id/status`.
- Blog: `GET /api/blog`, `GET /api/blog/:slug`, admin create/update/delete.
- Content blocks (WYSIWYG): `GET/POST /api/content/:key`.
- Coupons: `GET /api/coupons/:code`.
- Stats: `GET /api/stats/sales?range=30`, `GET /api/stats/top-products`, `GET /api/stats/admin-tiles`.

## Pages (23)
Home, Shop, Product Detail, Quick View, Cart, Checkout, Order Confirmation, Login, Signup, User Profile, My Orders, Wishlist, Blog Listing, Blog Post, About, Contact, FAQ, Search, Admin Dashboard, Admin Products, Admin Orders, Admin Users & Roles, Admin Content/WYSIWYG, Admin Analytics.

## Tests
- Backend: `cd backend && npm test` (Jest/Supertest). Health check included.
- Frontend: `cd frontend && npm test` (Vitest placeholder).

## Accessibility & UX
- Semantic HTML, alt text on imagery, focusable controls, high-contrast dark/light palettes.
- Luxury styling: Playfair Display + Inter, gold accents (#C9A94F), cream/ivory light mode, matte black dark mode, spacious layouts, soft shadows, subtle transitions.

## Notes
- Payments use mocked test flow in checkout; integrate Stripe/PayPal by swapping `/orders` call with payment intent flow.
- Socket events emitted for product/order updates; client listeners can be added for real-time dashboards.

