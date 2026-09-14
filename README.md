# 🎡 Omnipotent Wheelspin

**Omnipotent Wheelspin** is a delightful, AI‑powered decision‑making app. Describe
what you're deciding — _"dinner ideas"_, _"weekend activities"_, _"team names"_ — and
an AI chatbot streams back a colorful, spinnable prize wheel. Add or remove options by
hand, give the wheel a spin, and let it pick for you. Share any wheel with a link —
either as a guest (the wheel is encoded straight into the URL, no account needed) or by
signing in to save wheels to your profile and publish public share links friends can spin.

<p align="center">
  <img src="docs/screenshots/builder-wheel.png" alt="Omnipotent Wheelspin builder with a populated wheel" width="850">
</p>

---

## ✨ Features

- **AI list builder** — Chat with the "Wheelspin Bot" and it generates a ready‑to‑spin
  list from any topic, powered by Google Gemini. Responses **stream in token‑by‑token**.
- **Manual editing** — Add, remove, or clear options; each slice gets a distinct,
  auto‑generated HSL color kept as far as possible from the colors already in use.
- **Animated spinning wheel** — A physics‑style roulette with a winner reveal and a
  confetti celebration.
- **Share two ways** — Signed‑in users publish a wheel to a public URL (`/w/:shareId`)
  with a tracked spin count. Guests get an account‑free link (`/w/local#…`) that encodes
  the whole wheel in the URL — no sign‑in and nothing stored server‑side.
- **Save your wheels** — Create an account to persist wheels and manage them from your
  profile.
- **Account management** — Change your password or permanently delete your account (and
  all your data) from the Profile page.
- **Safety first** — The chatbot screens prompts for self‑harm language and responds with
  crisis‑support resources instead of forwarding them to the AI. The Gemini API key never
  leaves the server.
- **Privacy policy** — A built‑in `/privacy` page, linked from the footer.
- **Light & dark mode** — Theme toggle built in.
- **Fully responsive** — Works across phones, tablets, laptops, and large monitors.
- **Secure by design** — Row Level Security keeps every user's private wheels private,
  while anyone can read a wheel once it's been made public.

---

## 🛠️ Tech Stack

### Frontend

| Area          | Technology                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------- |
| Framework     | [React 19](https://react.dev/)                                                                  |
| Build tool    | [Vite 8](https://vite.dev/)                                                                     |
| Routing       | [React Router 7](https://reactrouter.com/)                                                      |
| UI components | [Mantine 9](https://mantine.dev/) (`@mantine/core`, `@mantine/hooks`, `@mantine/notifications`) |
| Icons         | [Tabler Icons](https://tabler.io/icons)                                                         |
| Animation     | [Framer Motion](https://www.framer.com/motion/)                                                 |
| Wheel         | [react-custom-roulette](https://www.npmjs.com/package/react-custom-roulette)                    |
| Server state  | [TanStack React Query 5](https://tanstack.com/query)                                            |

### Backend & Infrastructure

| Area                 | Technology                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| Database & Auth      | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Row Level Security)                          |
| Serverless functions | [Supabase Edge Functions](https://supabase.com/docs/guides/functions) (Deno): `chat`, `delete-account` |
| AI model             | [Google Gemini](https://ai.google.dev/) (`gemini-2.0-flash-lite`), streamed to the browser via SSE |
| Hosting              | [Vercel](https://vercel.com/) (SPA rewrites)                                                      |

### Tooling

| Area             | Technology                                                                              |
| ---------------- | --------------------------------------------------------------------------------------- |
| Linting          | [ESLint 10](https://eslint.org/) with React Hooks & React Refresh plugins               |
| Styling pipeline | [PostCSS](https://postcss.org/) with `postcss-preset-mantine` and `postcss-simple-vars` |

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│                     React SPA (Vite)                        │
│                                                             │
│  Pages:  Builder (/)          Profile (/profile)            │
│          Shared (/w/:shareId) Privacy (/privacy)            │
│  State:  TanStack React Query  •  AuthProvider (context)    │
└───────────────┬──────────────────────────┬─────────────────┘
                │                           │
     chat prompt (SSE stream)        CRUD + auth (RLS)
                │                           │
        ┌───────▼─────────┐        ┌────────▼─────────┐
        │  Supabase Edge  │        │    Supabase      │
        │   Functions:    │        │  Postgres + Auth │
        │  chat •         │        └──────────────────┘
        │  delete-account │
        └───────┬─────────┘
                │
        ┌───────▼────────┐
        │  Google Gemini │
        │ 2.0-flash-lite │
        └────────────────┘
```

Key design decisions:

- **Data access is centralized.** Components never call the Supabase client directly.
  All reads and writes go through TanStack React Query hooks (`src/hooks/`) that wrap
  data‑access functions (`src/utils/`).
- **The AI key stays server‑side.** The browser calls the `chat` Edge Function, which
  holds the `GEMINI_API_KEY` secret, screens the prompt, and streams Gemini's tokens back
  as Server‑Sent Events. The key never ships in the client bundle.
- **Account deletion runs with elevated privileges.** The `delete-account` Edge Function
  verifies the caller's JWT and uses the Supabase service‑role key to remove the auth user
  and all their data (cascading to their wheels).
- **Guests need no account.** A guest share link encodes the wheel (title + options) into
  the URL hash, so it can be opened and spun without ever touching the database.
- **Row Level Security enforces ownership.** A user can only see and modify their own
  wheels, while anyone can read a wheel once it's been made public via a share link.

---

## 📸 Screenshots

> Regenerate these at any time with `npm run screenshots` (see below) — the images are
> written to `docs/screenshots/`.

### Builder — the home page

Chat with the AI on the left, curate options in the middle, and spin the wheel on the right.

| Empty state                                          | With a generated wheel                                    |
| ---------------------------------------------------- | --------------------------------------------------------- |
| ![Empty builder](docs/screenshots/builder-empty.png) | ![Builder with wheel](docs/screenshots/builder-wheel.png) |

### Winner reveal

Spinning the wheel picks a winner and celebrates with confetti.

![Winner modal](docs/screenshots/result-modal.png)

### Profile — your saved wheels & account

Signed‑in users get a Profile page to revisit and share saved wheels, change their
password, or delete their account.

![Profile](docs/screenshots/profile.png)

### Shared wheel

Guest share links encode the wheel straight into the URL (`/w/local#…`) — no account
required to open and spin.

![Shared wheel](docs/screenshots/shared-wheel.png)

### Authentication

Email + password sign‑in and account creation via a Mantine modal.

![Auth modal](docs/screenshots/auth-modal.png)

### Responsive on mobile

The three‑panel builder stacks gracefully on small screens.

<p align="center">
  <img src="docs/screenshots/mobile-builder.png" alt="Mobile builder" width="320">
</p>

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.19+ (or 22.12+)
- A [Supabase](https://supabase.com/) project
- A [Google Gemini](https://ai.google.dev/) API key

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your Supabase project credentials
(**Supabase Dashboard → Project Settings → API**):

```bash
cp .env.example .env
```

```dotenv
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

> The Gemini API key is **not** stored here — it's a server‑side secret (see below), so
> it never reaches the browser.

### 3. Set up the database

Apply the schema migration to your Supabase project (creates the `profiles` and `wheels`
tables, triggers, and Row Level Security policies):

```bash
npx supabase link --project-ref YOUR-PROJECT-REF
npx supabase db push
```

### 4. Deploy the Edge Functions

```bash
# Store the Gemini key as a server-side secret (used by the chat function)
npx supabase secrets set GEMINI_API_KEY=your-gemini-key

# Deploy the functions
npx supabase functions deploy chat
npx supabase functions deploy delete-account
```

> `delete-account` uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, which Supabase
> injects into every Edge Function automatically — no extra secret to set.

### 5. Run the app

```bash
npm run dev
```

The app runs at [http://localhost:5173](http://localhost:5173).

---

## 📜 Available Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite dev server with HMR   |
| `npm run build`   | Build the production bundle          |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Run ESLint across the project        |

### Capturing README screenshots

The images above are generated from the running app with [Playwright](https://playwright.dev/):

```bash
# One-time: install the Playwright browser
npx playwright install chromium

# Terminal 1 — start the app
npm run dev

# Terminal 2 — capture screenshots into docs/screenshots/
npm run screenshots
```

The Builder, winner modal, guest shared wheel, auth modal, and mobile views all render
without a real Supabase backend, so the demo `.env` values are enough to capture them.

---

## 📁 Project Structure

```
.
├── public/                     # Static assets (favicon, icons)
├── src/
│   ├── App.jsx                 # App shell, routes, footer, config banner
│   ├── main.jsx                # Providers (Mantine, React Query, Router, Auth)
│   ├── theme.js                # Mantine theme (grape primary color)
│   ├── auth/
│   │   └── AuthProvider.jsx    # Supabase auth session context
│   ├── components/
│   │   ├── Navbar.jsx          # Top bar: brand, theme toggle, account menu
│   │   ├── Logo.jsx            # Wheel brand mark
│   │   ├── ChatPanel.jsx       # Streaming AI "Wheelspin Bot" chat
│   │   ├── ItemList.jsx        # Add/remove/clear wheel options
│   │   ├── WheelCanvas.jsx     # The spinning wheel + winner modal
│   │   ├── Confetti.jsx        # Winner celebration (Framer Motion)
│   │   └── AuthModal.jsx       # Sign in / create account (email + password)
│   ├── pages/
│   │   ├── Builder.jsx         # Home: build, spin, save & share a wheel
│   │   ├── Profile.jsx         # Saved wheels, change password, delete account
│   │   ├── SharedWheel.jsx     # Public (/w/:shareId) & guest (/w/local#…) wheels
│   │   └── PrivacyPolicy.jsx   # Privacy policy (/privacy)
│   ├── hooks/                  # TanStack React Query hooks
│   └── utils/                  # Supabase client, data access, wheel/color/share helpers
├── supabase/
│   ├── config.toml
│   ├── functions/
│   │   ├── chat/               # Gemini-backed streaming chatbot (Deno)
│   │   └── delete-account/     # Account deletion via service role (Deno)
│   └── migrations/             # SQL schema + RLS policies
├── scripts/
│   └── capture-screenshots.mjs # Playwright script behind `npm run screenshots`
├── docs/screenshots/           # Generated images used in this README
├── vercel.json                 # SPA rewrite rules
└── vite.config.js
```

---

## 🗄️ Data Model

**`profiles`** — one row per authenticated user, created automatically on signup. Stores
an optional `username` (a display name chosen at sign‑up, defaulting to the email prefix).

**`wheels`** — a saved wheelspin. Options are stored as a JSONB array of
`{ id, label, color }` objects. Each wheel has an opaque `share_id` used for public share
links, an `is_public` flag, and a `spin_count`. Row Level Security ensures owners manage
their own wheels while anyone can read a wheel that has been made public.

**Guest wheels** are never stored in the database — they live entirely in the share
link's URL hash (`/w/local#…`), decoded client‑side when the link is opened.

---

## 🚢 Deployment

The app is configured for [Vercel](https://vercel.com/):

1. Import the repository into Vercel.
2. Add the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables
   (**Settings → Environment Variables**).
3. Deploy. The included `vercel.json` rewrites all routes to `index.html` so client‑side
   routing (e.g. `/w/:shareId`) works on refresh.

If the Supabase variables are missing, the app renders a clear configuration banner
instead of crashing.
