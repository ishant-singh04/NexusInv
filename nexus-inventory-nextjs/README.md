# NexusInv — Next.js migration

This workspace contains a Next.js App Router frontend and the original Express/MongoDB API backend. The backend controllers, Mongoose models, middleware, route handlers and service logic have been retained as the source of truth for authentication and inventory operations. The React Router frontend has been replaced by a Next.js interface with the NexusInv dark navy/orange visual language.

## Included

- Next.js App Router application
- Login and registration screens connected to the original authentication API
- Token-based authenticated requests and role-aware navigation
- Dashboard backed by the inventory summary API
- Product, category, supplier, customer, transaction, staff and activity-log screens
- Create, update and deactivate flows for supported resource APIs
- Inventory movement listing and CSV export action
- Product QR lookup and stock-in / stock-out action
- QR generation, profile editing, print page
- Responsive sidebar, tables, search, dialogs, loading/error states
- Original Express backend and MongoDB models/controllers/routes retained

## Requirements

- Node.js 18.18+ (Node 20 LTS recommended)
- MongoDB running locally or a MongoDB Atlas connection
- npm

## Setup

### 1. Configure and start the backend

```bash
cd backend
npm install
```

Copy `backend/.env.example` to `backend/.env` and set a unique `JWT_SECRET` and your MongoDB URI.

```env
NODE_ENV=development
PORT=5001
SERVER_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017/inventory_db
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRE=7d
JWT_COOKIE_EXPIRE=7
BCRYPT_SALT_ROUNDS=12
```

Start the API:

```bash
npm run dev
```

The API should be available at `http://localhost:5001/api/v1`. Health check: `http://localhost:5001/api/v1/health`.

### 2. Start the Next.js frontend

Open a second terminal from the project root:

```bash
npm install
```

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
```

Then run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Important migration notes

This is a functional migration foundation, not a claim of pixel-perfect, feature-for-feature completion. The original source includes a number of specialized workflows and UI states that still need dedicated Next.js implementations and end-to-end verification, including camera-based QR scanning, full transaction line-item editing and invoice PDF generation, complete staff/login-history detail views, full audit-log filtering/expansion, avatar upload, password reset/change flows, advanced inventory valuation/movement analytics, PDF export, bulk product import, and exact parity for all original page-level styling. The retained backend exposes much of the underlying API functionality; the corresponding frontend workflows are not all surfaced in this first migration.

The original backend ZIP contained local `.env` files and generated logs/uploads. Those have intentionally not been copied into this deliverable. Create your own environment files from the examples; do not publish secrets or reuse credentials from a downloaded repository.

## Original application architecture

- Frontend source: React 18, React Router, Material UI, Redux Toolkit
- Backend: Express, MongoDB/Mongoose, JWT, bcrypt, Multer, QRCode, Nodemailer
- Roles: `admin`, `manager`, `staff`, `viewer`
- API version prefix: `/api/v1`
