# s30-nudge - Personal Operations Dashboard

<p align="center">
  <img src="https://placehold.co/1000x320/0f172a/FFFFFF?text=s30-nudge+-+Personal+Operations+Dashboard&font=raleway" alt="s30-nudge banner">
</p>

A premium full-stack personal operations dashboard built to manage bills, renewals, appointments, follow-ups, documents, and everyday life admin in one calm, polished workspace.

---

## 🚀 Live Demo

Frontend: [https://s30-nudge-web.vercel.app/](https://s30-nudge-web.vercel.app/)  
Backend API: [https://s30-nudge.onrender.com/](https://s30-nudge.onrender.com/)

---

## 🎯 Features

### Core Workspace Functionality

- Create and manage life-admin items from a single dashboard
- Track tasks, bills, renewals, follow-ups, appointments, and document requests
- Edit and delete items without leaving the workspace
- Update item status with a fast action flow
- Snooze items and bring them back into focus later

### Dashboard Experience

- Premium dashboard shell with clear visual hierarchy
- Operational summary cards for open, overdue, today, upcoming, and no-due-date items
- Filter items by status through a dedicated control layer
- Active filter summary for quick context while scanning
- Empty, loading, and error states built into the workspace flow

### Authentication and Account Controls

- Email/password signup and login
- JWT-based access flow with refresh-session support
- Session persistence on reload
- Change password flow in settings
- Logout and logout-all session controls

---

## 🛠️ Tech Stack

![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-111111?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-111111?style=for-the-badge&logo=drizzle&logoColor=C5F74F)
![Render](https://img.shields.io/badge/Render-4f46e5?style=for-the-badge&logo=render&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## 📌 Why This Project

This project was built to move beyond a plain reminder list and turn everyday admin into a product-style system with better structure, faster scanning, and more intentional workflows.

It focuses on:

- life-admin capture
- urgency and due-date visibility
- cleaner operational dashboards
- status-based workflow control
- production-style authentication and session handling
- polished full-stack product thinking

It is also part of my 3-project build journey:
1. Secure Authentication System
2. Background Job Queue
3. Personal Operations Dashboard

---

## 🧭 Product Design

### Item Model

- Each item belongs to a workspace / personal space
- Items support multiple types such as task, bill, renewal, follow-up, appointment, and document request
- Items can carry title, description, due date, snooze state, and status metadata
- This keeps the system flexible enough for different kinds of real-life admin work

### Dashboard System

- Dashboard cards surface urgency at a glance
- Filters narrow the workspace instantly by status
- Active filter summaries preserve context while switching views
- The UI is designed to feel calmer and more premium than a standard CRUD table

### Action Flow

- Items can be created quickly from the main workspace
- Status can be changed directly from the list view
- Edit, delete, snooze, and clear-snooze actions are available without leaving context
- This keeps the workflow fast and operational instead of form-heavy

---

## 👤 User Flow

### Capture

- User signs in and enters the dashboard
- A new life-admin item is created from the capture form
- The item appears immediately in the active workspace

### Organize

- User filters the list by status
- Dashboard metrics update the sense of urgency and workload
- Items can be edited, snoozed, or rescheduled as needed

### Execute

- User updates status as work progresses
- Overdue and upcoming items remain visible through the dashboard pulse
- The workspace becomes a practical system for staying on top of real responsibilities

---

## 🗂️ Project Structure

```bash
s30-nudge/
├── apps/
│   ├── api/                  # Express backend service
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── lib/
│   │   │   └── index.ts
│   │   └── package.json
│   └── web/                  # React + Vite frontend
│       ├── src/
│       │   ├── components/
│       │   ├── layouts/
│       │   ├── sections/
│       │   └── lib/
│       └── package.json
├── packages/
│   └── db/                   # Shared database schema / ORM package
└── README.md
```

> Folder names may evolve slightly, but the repo follows a monorepo-style frontend + backend + shared database package structure.

---

## ⚙️ Environment Variables

### Backend

```env
DATABASE_URL=your_postgres_connection_string
PORT=10000
NODE_ENV=development
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_TTL_DAYS=30
PASSWORD_RESET_TOKEN_TTL_MINUTES=30
FRONTEND_URL=http://localhost:5173
```

### Frontend

```env
VITE_API_BASE_URL=http://localhost:10000
```

> Additional environment variables may be used depending on deployment setup and optional integrations.

---

## 📋 Local Setup

### Prerequisites

- Node.js
- pnpm
- PostgreSQL connection string

### Installation

1. Clone the repository

```bash
git clone https://github.com/<your-username>/s30-nudge.git
cd s30-nudge
```

2. Install dependencies

```bash
pnpm install
```

3. Add environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

4. Start the development servers

```bash
pnpm --filter api dev
pnpm --filter web dev
```

---

## ▶️ Run Locally

### Start backend

```bash
pnpm --filter api dev
```

### Start frontend

```bash
pnpm --filter web dev
```

### Open app

```txt
http://localhost:5173
```

---

## 🌍 Production Deployment

### Frontend

- Deployed on Vercel
- Uses environment-based API base URL configuration
- Consumes auth, dashboard, and item-management endpoints from the backend

### Backend

- Deployed as a Node / Express service on Render
- Uses PostgreSQL-backed persistence and environment-based configuration
- Handles auth, item CRUD, dashboard data, and session-related flows

### Database

- Backed by PostgreSQL
- Designed to support typed item models and workspace-linked data
- Shared schema can be managed through the database package in the monorepo

---

## 🔌 API Overview

Example routes:

```txt
POST   /auth/signup
POST   /auth/login
POST   /auth/logout
POST   /auth/logout-all
POST   /auth/change-password
POST   /auth/refresh
GET    /auth/me
GET    /items
POST   /items
PATCH  /items/:id
DELETE /items/:id
PATCH  /items/:id/status
GET    /dashboard
```

> Actual route names may differ slightly depending on the current implementation.

---

## 🖼️ Screenshots

Add your latest product screenshots here once you are ready to showcase the final UI.

Suggested shots:

- Landing page
- Dashboard overview
- Create item form
- Filter / control layer
- Settings page

---

## 📚 What I Learned

This project helped me practice:

- designing a premium-feeling full-stack product
- structuring a monorepo with frontend, backend, and shared database code
- building production-style auth and session flows
- modeling flexible item workflows in PostgreSQL
- designing better dashboard UX for everyday operations
- turning a CRUD-heavy idea into a more product-oriented system

---

## 📈 Future Improvements

- Fully production-ready forgot-password email flow
- Notifications and reminder delivery channels
- Search and richer filtering
- Better profile and settings controls
- Recurring items and smarter scheduling
- Analytics and trend visualizations
- Automated tests and CI pipeline
- Mobile-first refinements

---

## 🗺️ Roadmap Position

This is **Project 3/3** in my full-stack systems journey:

- Project 1: Secure Authentication System
- Project 2: Background Job Queue
- Project 3: Personal Operations Dashboard

The goal is to build stronger real-world systems with better backend depth, sharper product thinking, and real deployment experience.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push the branch
5. Open a pull request

---

## 📬 Contact

If you want to discuss the project, suggest improvements, or connect about backend/full-stack development, feel free to open an issue or reach out through GitHub.

---

Built with a systems-first mindset and a product polish focus.
