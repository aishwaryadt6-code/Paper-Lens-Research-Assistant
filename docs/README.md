# Paper Lens

**AI-Powered Research Intelligence**

Paper Lens is a production-grade SaaS platform that allows researchers, academics, and organizations to upload research papers, extract structured information, detect conflicts, generate literature reviews, and collaborate in shared workspaces.

---

## Phase 1 — Foundation

Phase 1 delivers the complete platform foundation:

- Authentication (Email + Google OAuth + JWT)
- Research Workspaces with role-based collaboration
- PDF Upload with drag & drop, multi-file support, and GridFS storage
- Global Search across workspaces and papers
- Notification system
- Full dashboard with stats, recent papers, and workspace overview
- Premium SaaS UI with dark mode, animations, and skeleton loaders

---

## Tech Stack

| Layer      | Technology                                              |
|------------|---------------------------------------------------------|
| Frontend   | React 18, Vite 5, TypeScript, Tailwind CSS, Framer Motion |
| State      | Zustand, React Query                                    |
| Forms      | React Hook Form + Zod                                   |
| Backend    | Node.js 20, Express.js, TypeScript                      |
| Auth       | JWT (access + refresh tokens), Google OAuth             |
| Database   | MongoDB Atlas + Mongoose                                |
| Storage    | GridFS (PDF files)                                      |
| Security   | Helmet, CORS, Rate Limiting, mongo-sanitize             |
| Testing    | Vitest (frontend), Jest + Supertest (backend)           |

---

## Project Structure

```
paperlens/
├── frontend/                  # React + Vite application
│   └── src/
│       ├── components/        # UI primitives and feature components
│       │   ├── ui/            # Button, Input, Card, Modal, Toast, etc.
│       │   ├── layout/        # Sidebar, Navbar, CommandPalette
│       │   ├── workspace/     # WorkspaceCard, CreateWorkspaceModal
│       │   ├── papers/        # PaperCard, UploadModal
│       │   └── notifications/ # NotificationPanel
│       ├── pages/             # Route-level page components
│       ├── hooks/             # Custom React Query hooks
│       ├── stores/            # Zustand state stores
│       ├── services/          # Axios API service layer
│       ├── layouts/           # AppLayout, AuthLayout, ProtectedRoute
│       └── types/             # Shared TypeScript interfaces
│
├── backend/                   # Node.js + Express API
│   └── src/
│       ├── config/            # DB, GridFS, environment config
│       ├── models/            # Mongoose schemas (User, Workspace, Paper, etc.)
│       ├── repositories/      # Data access layer
│       ├── services/          # Business logic layer
│       ├── controllers/       # HTTP request handlers
│       ├── routes/            # Express route definitions
│       ├── middlewares/       # Auth, error handler, rate limiter, upload
│       ├── api/               # Input validators
│       └── utils/             # Logger, JWT, AppError, response helpers
│
└── docs/
    └── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB Atlas account (or local MongoDB)
- Redis (optional for Phase 1)
- Google OAuth credentials (optional)

---

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET in .env
npm run dev
```

The API will start at `http://localhost:5000`.

**Required `.env` values for Phase 1:**

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<256-bit-secret>
JWT_REFRESH_SECRET=<256-bit-refresh-secret>
CLIENT_URL=http://localhost:5173
```

---

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app will start at `http://localhost:5173`.

---

## API Reference

### Authentication

| Method | Endpoint           | Description              | Auth |
|--------|--------------------|--------------------------|------|
| POST   | /api/auth/register | Register new user        | No   |
| POST   | /api/auth/login    | Login with email+password| No   |
| POST   | /api/auth/google   | Google OAuth login       | No   |
| POST   | /api/auth/refresh  | Refresh access token     | No   |
| POST   | /api/auth/logout   | Logout                   | Yes  |
| GET    | /api/auth/me       | Get current user         | Yes  |

### Workspaces

| Method | Endpoint                          | Description          | Auth |
|--------|-----------------------------------|----------------------|------|
| GET    | /api/workspaces                   | List user workspaces | Yes  |
| POST   | /api/workspaces                   | Create workspace     | Yes  |
| GET    | /api/workspaces/:id               | Get workspace        | Yes  |
| PUT    | /api/workspaces/:id               | Update workspace     | Yes  |
| DELETE | /api/workspaces/:id               | Delete workspace     | Yes  |
| POST   | /api/workspaces/:id/members       | Invite member        | Yes  |
| DELETE | /api/workspaces/:id/members/:mid  | Remove member        | Yes  |

### Papers

| Method | Endpoint                                    | Description       | Auth |
|--------|---------------------------------------------|-------------------|------|
| POST   | /api/papers/workspaces/:workspaceId/upload  | Upload PDF        | Yes  |
| GET    | /api/papers/workspaces/:workspaceId         | List papers       | Yes  |
| GET    | /api/papers/recent                          | Recent papers     | Yes  |
| GET    | /api/papers/:id/stream                      | Stream PDF file   | Yes  |
| DELETE | /api/papers/:id                             | Delete paper      | Yes  |

### Profile

| Method | Endpoint      | Description        | Auth |
|--------|---------------|--------------------|------|
| GET    | /api/profile  | Get profile        | Yes  |
| PUT    | /api/profile  | Update profile     | Yes  |

### Notifications

| Method | Endpoint                      | Description              | Auth |
|--------|-------------------------------|--------------------------|------|
| GET    | /api/notifications            | List notifications       | Yes  |
| GET    | /api/notifications/unread-count | Get unread count       | Yes  |
| PATCH  | /api/notifications/:id/read   | Mark one as read         | Yes  |
| PATCH  | /api/notifications/read-all   | Mark all as read         | Yes  |

### Search

| Method | Endpoint     | Description                       | Auth |
|--------|--------------|-----------------------------------|------|
| GET    | /api/search?q=query | Global search across workspaces and papers | Yes |

---

## Running Tests

### Backend

```bash
cd backend
npm test
```

### Frontend

```bash
cd frontend
npm test
```

---

## Security Features

- **JWT access tokens** (15 min expiry) + **refresh tokens** (7 day expiry, rotation on use)
- **HttpOnly cookies** for refresh token storage
- **Helmet** for HTTP security headers
- **CORS** restricted to configured client origin
- **Rate limiting**: 200 req/15min globally, 20 req/15min for auth, 50 uploads/hour
- **mongo-sanitize** to prevent NoSQL injection
- **Input validation** on all endpoints via express-validator + Zod
- **Role-based access control** at API and workspace levels
- **Audit logging** for all sensitive operations

---

## Architecture Patterns

- **Repository Pattern** — data access isolated from business logic
- **Service Layer** — all business rules live in service classes
- **DTO Validation** — all inputs validated before reaching services
- **Centralized Error Handling** — all errors flow through `errorHandler` middleware
- **Structured Logging** — Winston with JSON format in production
- **Optimistic UI** — React Query cache updates for instant feedback

---

## Phase 2 Preview

Phase 2 will add:
- PDF text extraction and structured parsing
- ML classification by research domain
- Semantic search with FAISS vector index
- AI-powered paper summaries (FLAN-T5 / BART)
- Chat with papers
- Conflict detection between papers

---

*Paper Lens — AI-Powered Research Intelligence*
