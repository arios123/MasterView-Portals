<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Stripe-Billing-6772E5?style=for-the-badge&logo=stripe&logoColor=white" alt="Stripe" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
</p>

<h1 align="center">MasterView Portals</h1>
<p align="center">
  <strong>B2B SaaS for project-based teams</strong> — quotes, contracts, change orders, and client collaboration in one place.
</p>

<p align="center">
  <a href="#-about">About</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-features">Features</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-getting-started">Getting Started</a>
</p>

---

## 📌 About

**MasterView Portals** is a **full-stack SaaS** built for **contract-based and growing teams** (contractors, construction, remodeling, service businesses) who need to manage **projects**, **clients**, **quotes**, **contracts**, **change orders**, and **payments** without juggling spreadsheets and PDFs. It provides a **client portal** for approvals and **lookbooks**, **role-based access** per workspace, and **document generation** (Word/PDF) so teams can go from estimate to signed contract and change orders in one system.

The app is **multi-tenant** (workspaces), **subscription-based** (Stripe), and uses **Supabase** for **authentication**, **PostgreSQL**, and **Edge Functions**. The frontend is a **React** SPA with **TypeScript**, **Vite**, **Tailwind CSS**, and **shadcn/ui** (Radix primitives).

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | **React 18**, **TypeScript**, **Vite**, **React Router v6**, **TanStack React Query**, **Tailwind CSS**, **shadcn/ui**, **Radix UI**, **Framer Motion**, **Zod**, **React Hook Form** |
| **Backend / Data** | **Supabase** (Auth, **PostgreSQL**, **Row Level Security**, **Edge Functions**) |
| **Payments** | **Stripe** (Checkout Sessions, Customer Portal, subscriptions) |
| **Documents** | **docxtemplater**, **Pizzip**, **pdf-lib**, **React Markdown** |
| **Tooling** | **ESLint**, **TypeScript** strict mode, **CVA** (class-variance-authority) |

**Keywords:** `React` · `TypeScript` · `Supabase` · `Stripe` · `PostgreSQL` · `RLS` · `REST` · `SPA` · `SaaS` · `multi-tenant` · `RBAC` · `Edge Functions` · `Vite` · `Tailwind` · `REST API`

---

## ✨ Features

### Core application

- **Multi-workspace** — Users can belong to multiple **workspaces** and switch between them; each workspace has its own **subscription**, **staff**, and **settings**.
- **Role-based access control (RBAC)** — **Permissions** are scoped by workspace; **roles** (e.g. Admin, PM, Member) control access to **tabs** and **actions** (view/edit for Projects, Clients, Calendar, Admin sections, etc.).
- **Subscription guard** — App routes (Projects, Clients, Calendar, Admin, etc.) are gated by an **active subscription** (Stripe); unsubscribed users are directed to **choose-plan** or **select-workspace**.
- **Onboarding flow** — First-time workspace owners get a guided **onboarding** (modal + steps) that walks through **Staff**, **Pricing**, **Workspace Setup**, and **Projects**; state is persisted in **localStorage** and **database**.

### Projects & pipeline

- **Projects** — **Kanban-style** pipeline (e.g. Active, Completed, Lost) with **status** and **stage**; each project has a **client**, **crew assignments**, and links to **quotes**, **contracts**, **change orders**, **materials**, **payments**, and **attachments**.
- **Clients** — **Client list** with contact info and **project history**; **client profile** with all related projects and activity.
- **Calendar** — **Calendar view** for **events** and **appointments**; events can be linked to **clients** and **projects**; **appointment types** and **recurring events** supported.
- **Completed / Lost** — Dedicated boards for **completed** and **lost** projects to close the loop on the pipeline.

### Project-level features (per project)

- **Quote builder** — Build **quotes** with **line items**, **labor**, and **materials**; **one-click contract generation** from approved quotes; **templates** merge client/project data; **branded PDFs**.
- **Change orders** — **Change orders** update **contracts** and **totals**; clients **approve** in the portal; **history** of changes vs. original scope.
- **Document generation** — **Contracts** and **proposals** from **templates**; **DOCX** (docxtemplater) and **PDF** (pdf-lib); **customizable templates** and **branding**.
- **Lookbooks** — **Curated product/material selections**; clients **browse**, **comment**, and **approve** in the portal; **questions** and **summary**; link to **vendor specs**.
- **Materials** — **Contract** and **revised materials** per project; link to **line items** and **change orders**; **pricing** and **quantities**; **revisions** when scope changes.
- **Contract drafts** — **Multiple draft versions**; **compare** and **restore**; **active draft** drives **totals** and **change orders**.
- **Payments** — **Payment schedules** and **milestones**; **paid vs. outstanding**; **installments** across projects; **financial visibility**.
- **Attachments** — **Upload** and **organize** files by project; **folder structure**; **audit** for uploads/deletions.
- **Activity & crew** — **Assign clients** and **crew** to projects; **client assignments** and **project crew**; visibility into who’s on what project.

### Admin (workspace-level)

- **Staff** — **Invite** users by email (Supabase **Edge Function** + **invite flow**); **workspace members** and **roles**; **add/update member with role** via **RPC**.
- **Documents** — **Document groups** and **templates** for workspace.
- **Pricing** — **Pricing items**, **labor**, **materials** (catalog) for use in quotes and contracts.
- **Roles & permissions** — **Custom roles**; **granular permissions** (tab and component level); **view/edit** per resource.
- **Lookbook** — **Lookbook categories** and **default questions** for client-facing lookbooks.
- **Audit log** — **Workspace-wide audit log**; filter by **user**, **action**, **resource**; **compliance** and **accountability**.
- **Workspace setup** — **Branding**, **theme**, **progress bar**; **package groups** and **document groups**; **advanced** (owner) settings.
- **Export data** — **Export** workspace data (e.g. **CSV**) for backup or reporting.

### Auth & billing

- **Authentication** — **Supabase Auth**; **email/password**, **magic links**, **password reset**; **invite-by-email** with **finish-signup** flow; **session** and **JWT** handling; **route guards** (protected routes, **user_metadata** for profile completion).
- **Workspace invites** — **Invite** users to a workspace; **pending invites** in **user_metadata** and **Edge Function**; **accept** and **complete** invite; **conflict** handling (different account on invite link).
- **Subscriptions** — **Stripe Checkout** (Edge Function **create-checkout-session**); **Customer Portal** for managing subscription; **webhook** (or similar) to sync **subscription status**; **choose-plan** and **checkout success/cancel** flows.
- **Landing & marketing** — **Landing page**, **pricing**, **documentation**, **video tutorials**, **support**, **terms**, **privacy**; **allowlist** so **authenticated** users can still view **documentation** and **pricing**.

### UX & polish

- **Responsive** — **Desktop** and **mobile** layouts; **collapsible sidebar**; **mobile drawer** (sheet) for navigation.
- **Theming** — **Light/dark** (e.g. **next-themes** or custom) and **workspace theme** (progress bar, branding).
- **Onboarding** — **Modal** with **steps** and **highlights**; **skip** or **complete**; **localStorage** and **DB** for completion state.
- **Toasts** — **Sonner** and **shadcn toast** for **notifications**.

---

## 📁 Project structure

```
src/
├── components/          # Reusable UI (AppShell, AppSidebar, portal/*, ui/*)
├── contexts/            # Auth, Workspace, Onboarding, Price
├── hooks/               # usePermissions, useWorkspaceTaxRate, useProjectData, etc.
├── integrations/        # Supabase client and types
├── pages/               # Route-level pages (Index, ChoosePlan, landing/*, etc.)
├── queries/             # Data fetching and mutations (workspaces, users, subscriptions, etc.)
├── utils/               # Helpers (docxFormFiller, documentDataFormatter, termsUtils, etc.)
├── types/               # TypeScript types
├── constants/           # Landing routes allowlist, etc.
├── lib/                 # auditLog, utils
└── App.tsx              # Routes, providers, guards (ProtectedRoute, SubscriptionGuard)
```

**Notable patterns:** **Context API** (Auth, Workspace, Onboarding), **React Query** for server state, **permission hooks** (`usePermissions`, `Can`) for **RBAC**, **route guards** (ProtectedRoute, ProtectedTabRoute, SubscriptionGuard), **Supabase RPC** and **Edge Functions** for **invites** and **Stripe** sessions.

---

## 🚀 Getting started

1. **Clone** the repo and install dependencies:

   ```bash
   npm install
   ```

2. **Environment** — Ensure a **Supabase** project and **Stripe** account; add `.env` (or `.env.local`) with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and any **Edge Function** / **Stripe** keys as required by the app and Supabase functions.

3. **Run** the app:

   ```bash
   npm run dev
   ```

4. **Build** for production:

   ```bash
   npm run build
   ```

5. **Lint**:

   ```bash
   npm run lint
   ```