# Triage (AI-Powered Bug Management)

Triage is a collaborative bug-tracking platform that classifies incident severity
automatically. Report a bug in plain language and a AI model labels it
**High**, **Normal**, or **Low** in the background, so the board stays prioritized
without anyone triaging by hand.

> **Status:** Core flows (auth, workspaces, bug reporting, AI classification,
> comments, list/kanban views) are live. A frontend polish pass — themed
> toasts/dialogs on the bug board, in-place bug edit/reopen, and activity
> polling — is in progress. The REST API already supports all of these.

---

## Architecture

<svg viewBox="0 0 1400 980" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', 'Helvetica Neue', Arial, sans-serif">
  <defs>
    <!-- ============ EDIT COLORS HERE ============ -->
    <style>
      :root {
        --bg: #0a0d14;
        --accent-1: #3377ff;   /* primary accent */
        --accent-2: #6699ff;   /* secondary accent / hover-lighter */
        --accent-3: #1a66ff;   /* deep accent */
        --text-main: #ffffff;
        --text-dim: #9fb0d0;
        --boundary-stroke: #24304a;
        --boundary-fill: #0f1420;
        --node-fill: #131a2a;
        --node-stroke: #2b3a5c;
      }
      .title-text { fill: var(--text-main); font-weight: 700; }
      .subtitle-text { fill: var(--text-dim); font-weight: 400; }
      .boundary-label { fill: var(--accent-2); font-weight: 600; letter-spacing: 0.5px; }
      .node-title { fill: var(--text-main); font-weight: 700; }
      .node-sub { fill: var(--text-dim); font-weight: 400; }
      .edge-label { fill: var(--text-main); font-weight: 600; }
      .edge-label-bg { fill: var(--bg); opacity: 0.92; }
      .legend-text { fill: var(--text-dim); font-weight: 400; }
      .callout-text { fill: var(--text-dim); font-weight: 400; }
      .callout-title { fill: var(--accent-2); font-weight: 700; }
    </style>

    <!-- Drop shadow for nodes -->
    <filter id="dropShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.55"/>
    </filter>
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.4"/>
    </filter>

    <!-- Arrowheads -->
    <marker id="arrowSolid" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#6699ff"/>
    </marker>
    <marker id="arrowDashed" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#3377ff"/>
    </marker>

    <!-- Node gradient -->
    <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#161d30"/>
      <stop offset="100%" stop-color="#101625"/>
    </linearGradient>

    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3377ff"/>
      <stop offset="100%" stop-color="#6699ff"/>
    </linearGradient>
  </defs>

  <!-- ============ BACKGROUND ============ -->
  <rect x="0" y="0" width="1400" height="980" fill="#0a0d14"/>

  <!-- subtle grid texture -->
  <g opacity="0.035">
    <path d="M0,0 L1400,0 M0,50 L1400,50 M0,100 L1400,100 M0,150 L1400,150 M0,200 L1400,200 M0,250 L1400,250 M0,300 L1400,300 M0,350 L1400,350 M0,400 L1400,400 M0,450 L1400,450 M0,500 L1400,500 M0,550 L1400,550 M0,600 L1400,600 M0,650 L1400,650 M0,700 L1400,700 M0,750 L1400,750 M0,800 L1400,800 M0,850 L1400,850 M0,900 L1400,900 M0,950 L1400,950" stroke="#6699ff" stroke-width="1"/>
  </g>

  <!-- ============ TITLE ============ -->
  <text x="50" y="52" font-size="30" class="title-text">Triage — AI-Powered Bug Management</text>
  <text x="50" y="78" font-size="15" class="subtitle-text">System architecture &amp; request flow</text>
  <rect x="50" y="92" width="90" height="4" rx="2" fill="url(#accentGrad)"/>

  <!-- ============ LEGEND (top right) ============ -->
  <g transform="translate(970,28)">
    <rect x="0" y="0" width="380" height="66" rx="10" fill="#0f1420" stroke="#24304a" stroke-width="1"/>
    <line x1="18" y1="24" x2="60" y2="24" stroke="#6699ff" stroke-width="3" marker-end="url(#arrowSolid)"/>
    <text x="70" y="29" font-size="13" class="legend-text">Synchronous request / response</text>
    <line x1="18" y1="48" x2="60" y2="48" stroke="#3377ff" stroke-width="3" stroke-dasharray="6,5" marker-end="url(#arrowDashed)"/>
    <text x="70" y="53" font-size="13" class="legend-text">Asynchronous / background work</text>
  </g>

  <!-- ============ USER / BROWSER ============ -->
  <g filter="url(#softShadow)">
    <rect x="70" y="150" width="220" height="80" rx="16" fill="url(#nodeGrad)" stroke="#3d4d75" stroke-width="1.5"/>
  </g>
  <!-- browser icon -->
  <g transform="translate(95,168)">
    <rect x="0" y="0" width="34" height="26" rx="4" fill="none" stroke="#6699ff" stroke-width="2"/>
    <line x1="0" y1="7" x2="34" y2="7" stroke="#6699ff" stroke-width="2"/>
    <circle cx="5" cy="3.5" r="1.3" fill="#6699ff"/>
    <circle cx="9.5" cy="3.5" r="1.3" fill="#6699ff"/>
  </g>
  <text x="140" y="186" font-size="17" class="node-title">User / Browser</text>
  <text x="140" y="206" font-size="12.5" class="node-sub">End user session</text>

  <!-- ============ VERCEL BOUNDARY (Frontend) ============ -->
  <rect x="70" y="290" width="300" height="150" rx="14" fill="#0f1420" stroke="#24304a" stroke-width="1.5" stroke-dasharray="4,4"/>
  <text x="90" y="314" font-size="12.5" class="boundary-label" letter-spacing="1">HOSTED ON VERCEL</text>

  <g filter="url(#dropShadow)">
    <rect x="90" y="326" width="260" height="98" rx="16" fill="url(#nodeGrad)" stroke="#3377ff" stroke-width="1.5"/>
  </g>
  <!-- frontend icon: layers -->
  <g transform="translate(112,344)">
    <rect x="0" y="6" width="26" height="18" rx="3" fill="none" stroke="#6699ff" stroke-width="2"/>
    <rect x="6" y="0" width="26" height="18" rx="3" fill="#131a2a" stroke="#3377ff" stroke-width="2"/>
  </g>
  <text x="156" y="356" font-size="17" class="node-title">Frontend</text>
  <text x="112" y="380" font-size="12.5" class="node-sub">Next.js 16 · React 19</text>
  <text x="112" y="397" font-size="12.5" class="node-sub">Tailwind v4</text>
  <text x="112" y="416" font-size="11.5" class="node-sub" opacity="0.75">Server-rendered client app</text>

  <!-- ============ RENDER BOUNDARY (Backend + AI) ============ -->
  <rect x="70" y="500" width="740" height="330" rx="14" fill="#0f1420" stroke="#24304a" stroke-width="1.5" stroke-dasharray="4,4"/>
  <text x="90" y="524" font-size="12.5" class="boundary-label" letter-spacing="1">HOSTED ON RENDER</text>

  <!-- Backend API -->
  <g filter="url(#dropShadow)">
    <rect x="90" y="538" width="280" height="120" rx="16" fill="url(#nodeGrad)" stroke="#3377ff" stroke-width="1.5"/>
  </g>
  <!-- server icon -->
  <g transform="translate(112,558)">
    <rect x="0" y="0" width="26" height="8" rx="2" fill="none" stroke="#6699ff" stroke-width="2"/>
    <rect x="0" y="12" width="26" height="8" rx="2" fill="none" stroke="#6699ff" stroke-width="2"/>
    <circle cx="4" cy="4" r="1.2" fill="#6699ff"/>
    <circle cx="4" cy="16" r="1.2" fill="#6699ff"/>
  </g>
  <text x="156" y="568" font-size="17" class="node-title">Backend API</text>
  <text x="112" y="592" font-size="12.5" class="node-sub">Express 5 · Prisma ORM</text>
  <text x="112" y="609" font-size="11.5" class="node-sub" opacity="0.75">REST endpoints, auth, business logic</text>
  <text x="112" y="628" font-size="11.5" class="node-sub" opacity="0.75">Writes bug records as "Pending"</text>

  <!-- AI Service -->
  <g filter="url(#dropShadow)">
    <rect x="490" y="538" width="280" height="120" rx="16" fill="url(#nodeGrad)" stroke="#3377ff" stroke-width="1.5"/>
  </g>
  <!-- ai chip icon -->
  <g transform="translate(512,556)">
    <rect x="4" y="4" width="20" height="20" rx="3" fill="none" stroke="#6699ff" stroke-width="2"/>
    <rect x="9" y="9" width="10" height="10" rx="1.5" fill="#6699ff" opacity="0.5"/>
    <line x1="14" y1="0" x2="14" y2="4" stroke="#6699ff" stroke-width="2"/>
    <line x1="14" y1="24" x2="14" y2="28" stroke="#6699ff" stroke-width="2"/>
    <line x1="0" y1="14" x2="4" y2="14" stroke="#6699ff" stroke-width="2"/>
    <line x1="24" y1="14" x2="28" y2="14" stroke="#6699ff" stroke-width="2"/>
  </g>
  <text x="556" y="568" font-size="17" class="node-title">AI Service</text>
  <text x="512" y="592" font-size="12.5" class="node-sub">FastAPI</text>
  <text x="512" y="609" font-size="11.5" class="node-sub" opacity="0.75">POST /classify endpoint</text>
  <text x="512" y="628" font-size="11.5" class="node-sub" opacity="0.75">Fills in severity asynchronously</text>

  <!-- PostgreSQL (Neon) -->
  <g filter="url(#dropShadow)">
    <rect x="90" y="700" width="280" height="110" rx="16" fill="url(#nodeGrad)" stroke="#1a66ff" stroke-width="1.5"/>
  </g>
  <!-- db icon -->
  <g transform="translate(112,716)">
    <ellipse cx="13" cy="4" rx="13" ry="4" fill="none" stroke="#6699ff" stroke-width="2"/>
    <path d="M0,4 L0,20 A13,4 0 0,0 26,20 L26,4" fill="none" stroke="#6699ff" stroke-width="2"/>
    <path d="M0,12 A13,4 0 0,0 26,12" fill="none" stroke="#6699ff" stroke-width="2"/>
  </g>
  <text x="156" y="730" font-size="17" class="node-title">PostgreSQL</text>
  <text x="112" y="754" font-size="12.5" class="node-sub">Neon (serverless)</text>
  <text x="112" y="773" font-size="11.5" class="node-sub" opacity="0.75">Primary data store</text>
  <text x="112" y="789" font-size="11" class="node-sub" opacity="0.6">users · workspaces · bugs</text>
  <text x="112" y="803" font-size="11" class="node-sub" opacity="0.6">comments · activity</text>

  <!-- Callout box near async path -->
  <g filter="url(#softShadow)">
    <rect x="490" y="700" width="280" height="110" rx="14" fill="#101a30" stroke="#3377ff" stroke-width="1.2" stroke-dasharray="3,3"/>
  </g>
  <text x="512" y="724" font-size="13" class="callout-title">ℹ Note</text>
  <text x="512" y="746" font-size="12" class="callout-text">Bug is saved immediately as</text>
  <text x="512" y="764" font-size="12" class="callout-text"><tspan font-weight="700" fill="#ffffff">Pending</tspan>; severity is filled in</text>
  <text x="512" y="782" font-size="12" class="callout-text">asynchronously once the</text>
  <text x="512" y="800" font-size="12" class="callout-text">model responds.</text>

  <!-- ============ HUGGING FACE (external) ============ -->
  <rect x="900" y="500" width="450" height="330" rx="14" fill="#0f1420" stroke="#24304a" stroke-width="1.5" stroke-dasharray="4,4"/>
  <text x="920" y="524" font-size="12.5" class="boundary-label" letter-spacing="1">EXTERNAL API</text>

  <g filter="url(#dropShadow)">
    <rect x="930" y="560" width="380" height="180" rx="16" fill="url(#nodeGrad)" stroke="#6699ff" stroke-width="1.5"/>
  </g>
  <!-- HF icon: sparkle -->
  <g transform="translate(952,580)">
    <path d="M13,0 L16,10 L26,13 L16,16 L13,26 L10,16 L0,13 L10,10 Z" fill="#6699ff"/>
  </g>
  <text x="990" y="596" font-size="17" class="node-title">Hugging Face Inference API</text>
  <text x="952" y="622" font-size="12.5" class="node-sub">Model: bart-large-mnli</text>
  <text x="952" y="640" font-size="12.5" class="node-sub">Zero-shot classification</text>

  <line x1="952" y1="656" x2="1290" y2="656" stroke="#24304a" stroke-width="1"/>

  <text x="952" y="678" font-size="12" class="node-sub" opacity="0.8">Returns predicted severity label:</text>
  <g transform="translate(952,690)">
    <rect x="0" y="0" width="70" height="26" rx="13" fill="none" stroke="#ff5c5c" stroke-width="1.5"/>
    <text x="35" y="17" font-size="11.5" text-anchor="middle" fill="#ff8080" font-weight="600">High</text>
    <rect x="82" y="0" width="86" height="26" rx="13" fill="none" stroke="#6699ff" stroke-width="1.5"/>
    <text x="125" y="17" font-size="11.5" text-anchor="middle" fill="#8fb3ff" font-weight="600">Normal</text>
    <rect x="180" y="0" width="70" height="26" rx="13" fill="none" stroke="#4dd4a0" stroke-width="1.5"/>
    <text x="215" y="17" font-size="11.5" text-anchor="middle" fill="#7de8bf" font-weight="600">Low</text>
  </g>

  <!-- ============ EDGES ============ -->

  <!-- User -> Frontend -->
  <path d="M180,230 L180,290" fill="none" stroke="#6699ff" stroke-width="2.5" marker-end="url(#arrowSolid)"/>
  <rect x="192" y="248" width="76" height="24" rx="6" class="edge-label-bg"/>
  <text x="230" y="264" font-size="12.5" text-anchor="middle" class="edge-label">HTTPS</text>

  <!-- Frontend -> Backend API -->
  <path d="M220,424 L220,470 L230,470 L230,538" fill="none" stroke="#6699ff" stroke-width="2.5" marker-end="url(#arrowSolid)"/>
  <rect x="238" y="452" width="180" height="42" rx="6" class="edge-label-bg"/>
  <text x="248" y="468" font-size="12.5" class="edge-label">REST + JWT</text>
  <text x="248" y="486" font-size="12.5" class="edge-label">(axios)</text>

  <!-- Backend API -> PostgreSQL -->
  <path d="M230,658 L230,700" fill="none" stroke="#6699ff" stroke-width="2.5" marker-end="url(#arrowSolid)"/>
  <rect x="242" y="668" width="72" height="24" rx="6" class="edge-label-bg"/>
  <text x="278" y="684" font-size="12.5" text-anchor="middle" class="edge-label">Prisma</text>

  <!-- Backend API -> AI Service (dashed async) -->
  <path d="M370,585 L490,585" fill="none" stroke="#3377ff" stroke-width="2.5" stroke-dasharray="7,6" marker-end="url(#arrowDashed)"/>
  <rect x="378" y="546" width="130" height="24" rx="6" class="edge-label-bg"/>
  <text x="443" y="562" font-size="12" text-anchor="middle" class="edge-label">POST /classify</text>
  <rect x="372" y="592" width="145" height="22" rx="6" fill="#0a0d14" opacity="0.92"/>
  <text x="444" y="608" font-size="11" text-anchor="middle" fill="#8fb3ff" font-style="italic">async — non-blocking</text>

  <!-- AI Service -> Hugging Face -->
  <path d="M770,590 L900,590" fill="none" stroke="#6699ff" stroke-width="2.5" marker-end="url(#arrowSolid)"/>
  <rect x="792" y="565" width="88" height="22" rx="6" class="edge-label-bg"/>
  <text x="836" y="581" font-size="11.5" text-anchor="middle" class="edge-label">classify text</text>

  <!-- Hugging Face -> AI Service (response) -->
  <path d="M900,660 L770,660" fill="none" stroke="#3377ff" stroke-width="2.5" stroke-dasharray="7,6" marker-end="url(#arrowDashed)"/>
  <rect x="782" y="668" width="118" height="22" rx="6" class="edge-label-bg"/>
  <text x="841" y="684" font-size="11.5" text-anchor="middle" class="edge-label">severity result</text>

  <!-- AI service back to Backend indicator (update record), curved -->
  <path d="M630,538 C630,470 500,470 370,585" fill="none" stroke="#3377ff" stroke-width="2" stroke-dasharray="5,5" marker-end="url(#arrowDashed)" opacity="0.85"/>
  <rect x="440" y="490" width="180" height="22" rx="6" fill="#0a0d14" opacity="0.92"/>
  <text x="530" y="506" font-size="11" text-anchor="middle" fill="#8fb3ff" font-style="italic">updates bug severity in DB</text>

  <!-- ============ FOOTER ============ -->
  <text x="50" y="945" font-size="11.5" fill="#5a6a8f">Triage architecture · generated diagram · edit colors via the &lt;style&gt; block in &lt;defs&gt;</text>
</svg>


## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, Recharts, lucide-react, axios |
| **Backend** | Node.js, Express 5, Prisma 5, JWT (`jsonwebtoken`), `bcrypt`, `express-rate-limit`, CORS |
| **AI Service** | Python, FastAPI, Uvicorn — proxies Hugging Face zero-shot classification (`facebook/bart-large-mnli`) |
| **Database** | PostgreSQL (Neon serverless) |
| **Hosting** | Frontend → Vercel · Backend & AI → Render

## How It Works

**Authentication.** Registration is explicit (`/auth/register`); logging in never
silently creates an account, so a typo'd email fails loudly instead of stranding
you in a new empty workspace. Passwords are bcrypt-hashed with an 8-character
minimum. Credential and join endpoints are rate-limited.

**Workspaces.** Each workspace has a 6-character access key for others to join,
and an **owner** (its creator). Only the owner can delete a workspace; other
members can leave. If an owner leaves, ownership passes to the earliest remaining
member; an emptied workspace is cleaned up rather than orphaned.

**Bug lifecycle.** Report → saved as `Pending` → AI classifies in the background →
severity updated (`High`/`Normal`/`Low`), or left `Pending` for manual setting if
the model is unreachable. Bugs can be resolved, reopened, edited, commented on,
and deleted. Every action is written to a per-workspace activity feed.

**Sample workspace.** A static, read-only demo workspace with 10 example bugs is
shown to new users as a display case. It makes no API calls and can't be
modified.

---

## API Reference

All `/dashboards` and `/bugs` routes require an `Authorization: Bearer <token>`
header. Membership is enforced server-side on every workspace and bug.

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/auth/register` | Create an account (rate-limited) |
| `POST` | `/auth/login` | Log in (rate-limited) |
| `GET` | `/dashboards` | List the caller's workspaces |
| `POST` | `/dashboards` | Create a workspace (caller becomes owner) |
| `GET` | `/dashboards/:id` | Workspace detail + members + recent activity |
| `POST` | `/dashboards/join` | Join by access key (rate-limited) |
| `DELETE` | `/dashboards/:id` | Delete a workspace (owner only) |
| `POST` | `/dashboards/:id/leave` | Leave a workspace |
| `GET` | `/dashboards/:id/bugs` | List bugs (with comments) |
| `POST` | `/bugs` | Report a bug — returns `202`, classifies async |
| `PATCH` | `/bugs/:id` | Edit title/description/severity |
| `PATCH` | `/bugs/:id/resolve` | Mark resolved |
| `PATCH` | `/bugs/:id/reopen` | Reopen |
| `DELETE` | `/bugs/:id` | Delete a bug and its comments |
| `POST` | `/bugs/:id/comments` | Add a comment |
| `GET` | `/health` | Liveness check |

The AI service exposes `POST /classify` (`{ title, description }` →
`{ severity }`) and `GET /health`.

---

## Data Model

```
User ──< owns >── Dashboard          User >──< Dashboard   (membership, many-to-many)
                     │
                     ├──< Bug ──< Comment >── User
                     └──< Activity

Bug.severity ∈ { Pending, High, Normal, Low }
Bug.status   ∈ { OPEN, RESOLVED }
```

See [`Backend/prisma/schema.prisma`](Backend/prisma/schema.prisma) for the full
schema.

---

## Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | Vercel | Set `NEXT_PUBLIC_API_URL` to the backend's public URL |
| Backend | Render | Add the backend `.env` vars; add the frontend origin to CORS `allowedOrigins` in `Backend/src/index.ts` |
| AI Service | Render | Set `HF_TOKEN`; start with `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Database | Neon | Use the pooled connection string as `DATABASE_URL` |

Free-tier Render services sleep when idle and take ~30–50s to wake — the UI
surfaces a warning during that cold start.
