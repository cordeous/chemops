# ChemOps — Chemical Sales & Billing Management Platform

A full-stack web application built for the chemical industry to manage product catalogs, regulatory compliance, sales operations, batch tracking, and invoicing in a single centralized system.

**Live demo:** [cordeous.github.io/chemops](https://cordeous.github.io/chemops/)
**GitHub:** [github.com/cordeous/chemops](https://github.com/cordeous/chemops)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB (Atlas) |
| Auth | JWT (7-day expiry, localStorage) |
| Deployment | GitHub Pages (frontend) |

---

## Features

- **Role-based dashboards** — Admin, Sales, Finance, Compliance each get a tailored view
- **Product management** — CAS/UN numbers, hazard classification, SDS documents, inventory levels
- **Batch tracking** — expiry badges, warehouse location, per-product batch history
- **Order lifecycle** — multi-item builder, auto-pricing, tax calc, status transitions (Pending → Approved → Shipped → Invoiced → Paid)
- **Invoicing** — auto-generated from orders, PDF export, Mark Paid, overdue detection
- **Customer management** — compliance status, credit limits, address book, full CRUD
- **Compliance** — SDS tracker, regulatory CSV export, customer verification workflow
- **Reports & analytics** — sales trends, top customers, inventory turnover, hazmat sales, outstanding receivables
- **Admin panel** — user management, feature flags, webhook config, audit log, low-stock alerts
- **Landing page** — public marketing page at `/`

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@chemops.com | admin123 |
| Sales | sales@chemops.com | sales123 |
| Finance | finance@chemops.com | finance123 |
| Compliance | compliance@chemops.com | compliance123 |

---

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone

```bash
git clone https://github.com/cordeous/chemops.git
cd chemops
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.jn2jfkn.mongodb.net/chemops?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_here
```

Seed the database (first time only):

```bash
node seed.js
```

Start backend:

```bash
npm run dev
```

Backend runs at `http://localhost:5000`

### 3. Frontend

```bash
cd frontend-react
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Project Structure

```
chemops/
├── backend/
│   ├── src/
│   │   ├── routes/          # Express route handlers
│   │   ├── models/          # Mongoose schemas
│   │   └── middleware/      # Auth, audit, validation
│   ├── server.js            # Express entry point (port 5000)
│   └── seed.js              # Database seed script
│
├── frontend-react/
│   ├── src/
│   │   ├── api/client.js    # Axios instance + auth interceptor
│   │   ├── context/         # AuthContext (JWT, user state)
│   │   ├── components/      # Layout, Sidebar, Modal, KpiCard, etc.
│   │   ├── pages/           # One file per route
│   │   │   └── dashboards/  # Role-specific dashboard components
│   │   └── utils/format.js  # Currency, date, status helpers
│   └── vite.config.js
│
└── .github/workflows/
    └── deploy.yml           # CI/CD → GitHub Pages
```

---

## API Overview

All endpoints require `Authorization: Bearer <token>` except `/api/auth/login`.
All responses return `{ success: bool, data: ... }`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/products` | List products (search, filter) |
| POST | `/api/products` | Create product |
| GET | `/api/batches` | List batches |
| GET | `/api/customers` | List customers |
| POST | `/api/orders` | Create order |
| PUT | `/api/orders/:id/status` | Advance order status |
| GET | `/api/invoices` | List invoices |
| GET | `/api/invoices/:id/pdf` | Download PDF |
| PUT | `/api/invoices/:id/status` | Mark paid / issue |
| GET | `/api/reports/sales` | Monthly revenue |
| GET | `/api/reports/top-customers` | Top customers by spend |
| GET | `/api/compliance/sds-tracker` | SDS completeness |
| GET | `/api/admin/users` | User list (Admin only) |
| PUT | `/api/admin/features` | Toggle feature flags |

---

## Deployment

Frontend deploys automatically to GitHub Pages on every push to `master` via GitHub Actions.

To enable for your fork:
1. Go to **Settings → Pages**
2. Set Source to **GitHub Actions**

The workflow builds with `VITE_API_URL` pointing to the backend. For a fully live deployment, host the backend on Railway, Render, or similar.

---

## Roles & Permissions

| Role | Access |
|---|---|
| Admin | Full access — users, features, audit log, all data |
| Sales | Customers, orders, limited product view |
| Finance | Invoices, payments, revenue reports |
| Compliance | SDS tracker, compliance status, regulatory export |

---

## License

MIT
