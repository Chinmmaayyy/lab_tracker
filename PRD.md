# Device Usage Tracker — Product Requirements Document (PRD)

> A real-time, multi-device, multi-lab application & web usage monitoring system for Windows machines, with a live admin dashboard, suspicious-activity alerting, and Excel export.

---

## 1. Product Summary

| Field | Value |
|---|---|
| Product Name | Device Usage Tracker |
| Type | Desktop Tracking Agent + Web Admin Dashboard |
| Target OS (client) | Windows 10 / 11 |
| Deployment Mode | Lab-based (Lab 0 – Lab 6), each lab isolates its own devices |
| Update Frequency | 5 seconds (tracker heartbeat) / 15 seconds (online-status threshold) |
| Backend | Firebase Realtime Database (no custom server) |
| Use Case | Classroom / lab supervision, parental monitoring, productivity auditing |

---

## 2. System Components

### 2.1 Python Tracker Client (`python_client/tracker.py`)
- Silent background agent that runs on every monitored Windows device.
- Detects the **active foreground window** every 5 seconds using the Win32 API (`ctypes` + `psutil`).
- Captures: process name, window title, browser tab title.
- Writes directly to Firebase Realtime Database using the Admin SDK (service account).
- Auto-registers in the Windows startup registry when run as a frozen `.exe`.
- Packaged as a standalone executable via PyInstaller (`tracker.spec`).

### 2.2 React Web Dashboard (`front-end/`)
- Built with React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui (Radix primitives).
- Subscribes to Firebase RTDB in real time (`onValue`).
- Dark, cyber-themed responsive UI.
- Interactive pie charts (Recharts) + process stack list per device.
- Excel export per device and per lab (SheetJS + FileSaver).
- Admin-gated destructive actions.

### 2.3 Firebase Realtime Database
- Shared backend for all clients and dashboard instances.
- Organized per lab → per device → current/history/alerts.
- DB URL is hard-coded: `https://fir-os-dc607-default-rtdb.firebaseio.com`.

---

## 3. Core Features

### 3.1 Real-Time Device Monitoring
- Each device pushes its current app + website title + last-updated timestamp every 5 seconds.
- A device is marked **ONLINE** if `Date.now() - last_updated < 15 000 ms`, otherwise **OFFLINE**.
- Dashboard revalidates online status locally every 5 seconds even if Firebase has no new event.

### 3.2 Per-Application Usage Tracking
- Tracks total seconds spent in every `.exe` process name (e.g. `chrome`, `code`, `explorer`).
- Uses Firebase **transactions** to accumulate seconds atomically — safe under concurrent writes.
- Bucketed per UTC date under `history/{YYYY-MM-DD}/app_usage/{app_name}`.

### 3.3 Browser-Specific Web Usage
- Supported browsers: **msedge, chrome, brave, firefox**.
- When the active app is a supported browser, the window title (minus trailing `" - Browser Name"`) is stored as the visited page title.
- Path: `history/{date}/web_usage/{browser}/{sanitized_site_title}` = seconds.
- Dashboard lets admin click a browser from the process-stack list to see its per-site breakdown and total web time.

### 3.4 Suspicious Activity Alerts
- Python tracker scans the active app + site against a hard-coded `SUSPICIOUS_KEYWORDS` list:
  - AI tools: chatgpt, openai, gpt, gemini, bard, claude, copilot, blackbox, phind, perplexity, poe
  - Writing: google docs, notion, notion ai
  - Search engines: google, bing, yahoo
  - Coding help: stackoverflow, github, geeksforgeeks, w3schools
  - Messaging: whatsapp web, telegram, discord
  - File sharing: drive.google, dropbox
  - Social: quora, reddit
- On match, pushes `alerts/{auto_id}` with `{ type, app, website, timestamp }`.
- Rate-limited with a **60-second cooldown** per device (`ALERT_COOLDOWN`).
- Dashboard shows a dedup'd toast on arrival (10 s visible), an alert bell with live counter, and a full alerts panel with "Clear All" for the lab.

### 3.5 Daily History
- All metrics (total screen time, app usage, web usage) are bucketed by UTC date.
- Enables historical Excel reports spanning every day a device has reported.

### 3.6 Interactive Pie Chart
- Recharts donut: top 10 apps by time for the latest day.
- Click an app in the process stack to highlight/enlarge its slice and show its time in the center HUD.
- Selecting a browser swaps the pie panel for the browser's site-breakdown list (title + seconds + progress bar).

### 3.7 Excel Export
- **Per-device** (`exportDeviceToExcel`): 3 sheets — Daily Summary, App Logs, Web Logs.
- **Per-lab** (`exportLabToExcel`): 3 sheets — Lab Overview, Combined App Logs, Combined Web Logs.
- Time values converted to minutes (2-decimal).
- Files named `{device_id}_Report.xlsx` or `Lab_{labId}_Full_Report.xlsx`.

### 3.8 Admin Authentication
- Login via lab ID (`0`–`6`) + shared admin password (`QWERTY123456`, hard-coded in [Login.tsx](front-end/src/pages/Login.tsx#L9)).
- Valid labs: `0, 1, 2, 3, 4, 5, 6`.
- Successful login stores `labId` in `localStorage`.
- **Lab 0 legacy mode**: reads from the root `devices/` path (pre-lab-routing deployment); Labs 1–6 read from `labs/{labId}/devices/`.

### 3.9 Admin-Gated Device Deletion
- "Trash" button per device opens a confirmation dialog that requires re-entering the admin password.
- Two options:
  - **DIRECT_PURGE** — delete only.
  - **SAVE_&_PURGE** — download the device's Excel report, then delete the Firebase node.

### 3.10 Auto-Start on Windows
- When `tracker.exe` runs (frozen build), it writes itself to `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run` under key `DeviceUsageTracker`.
- Development runs (`python tracker.py`) skip this step.

### 3.11 Resilience & Logging
- Firebase init failure writes to `tracker_log.txt` and exits.
- Runtime errors caught in the main loop; tracker sleeps 10 s then retries.
- Alert-push failures are swallowed so they never interrupt the tracker loop.
- Startup health-check pings `__healthcheck/startup_probe` to fail fast on bad credentials.

---

## 4. Data Model (Firebase RTDB)

### 4.1 Schema (Lab-Scoped)
```
labs/
  └── {LAB_ID}/                         # "1" .. "6"
       └── devices/
            └── {device_id}/            # "{LAB_ID}-{hostname}-{mac_int}"
                 ├── current/
                 │    ├── app: "chrome"
                 │    ├── website: "GitHub - Dashboard"
                 │    └── last_updated: "2026-04-22T10:30:00Z"
                 ├── history/
                 │    └── {YYYY-MM-DD}/
                 │         ├── total_screen_time: 14400
                 │         ├── app_usage/
                 │         │    ├── chrome: 7200
                 │         │    └── code: 5400
                 │         └── web_usage/
                 │              └── chrome/
                 │                   ├── GitHub - Dashboard: 3600
                 │                   └── Stack Overflow: 3600
                 └── alerts/
                      └── {push_id}/
                           ├── type: "suspicious_activity"
                           ├── app: "chrome"
                           ├── website: "ChatGPT"
                           └── timestamp: "2026-04-22T10:31:00Z"
```

### 4.2 Schema (Legacy / Lab 0)
Same node shape, but rooted at `devices/{device_id}/...` (no `labs/0` prefix).

### 4.3 Device ID Format
`{LAB_ID}-{socket.gethostname()}-{uuid.getnode()}` — e.g. `1-LAB-PC-05-245680315654321`.

### 4.4 Key Sanitization
Firebase keys cannot contain `.`, `#`, `$`, `[`, `]`, `/`. These are replaced with `_` by `sanitize_key()`.

---

## 5. End-to-End Workflow

### 5.1 Initial Setup (one-time)
1. Create a Firebase project, enable Realtime Database.
2. Generate a Service Account key → save at `python_client/firebase/serviceAccountKey.json`.
3. Copy the web-app Firebase config into `front-end/.env` (`VITE_FIREBASE_*` vars).
4. `cd front-end && npm install`.
5. `cd python_client && pip install -r requiremenets.txt` (note typo in filename).
6. (Optional) `pyinstaller tracker.spec` to build a standalone `tracker.exe`.

### 5.2 Client Deployment Workflow
1. Set `TRACKER_LAB_ID` env var on each machine (default `"1"`) so it reports into the right lab.
2. Place the compiled `tracker.exe` + adjacent `firebase/serviceAccountKey.json` on the device.
3. Double-click the `.exe` once → it registers itself for auto-start → runs silently on every boot.
4. Tracker begins pushing heartbeats within 5 s.

### 5.3 Tracker Runtime Loop (every 5 s)
1. Compute today's UTC date → path `labs/{LAB_ID}/devices/{device_id}/history/{date}`.
2. Read the active foreground window → extract `(app, website)`.
3. If suspicious → push an alert (respecting 60 s cooldown).
4. If `last_app` was set: atomically increment `app_usage/{last_app}`, `web_usage/{last_app}/{last_site}`, and `total_screen_time` by `elapsed` seconds.
5. Overwrite `current/` with the new app/site/timestamp.
6. Every 30 s, log one heartbeat line to stdout.
7. Sleep 5 s; on exception, log + sleep 10 s.

### 5.4 Admin Workflow
1. Open the dashboard URL → redirected to `/login` if no `labId` in localStorage.
2. Enter lab ID (0–6) + shared password → lands on `/`.
3. Dashboard renders a grid of DeviceCards for all devices seen in the last 12 hours, sorted with online devices first.
4. Admin actions available:
   - View live current app + current website per device.
   - Click any app in the process stack → pie slice highlights or (if browser) site list replaces the pie.
   - Click download icon on a card → per-device Excel.
   - Click "Download Lab Report" in header → lab-wide Excel.
   - Click the alerts bell → full alerts panel, "Clear All" wipes `alerts/` for every device in the lab.
   - Click trash icon → password-gated purge dialog (direct or save+purge).
   - Click logout → clears `labId` + returns to `/login`.

---

## 6. Page / Route Inventory

| Route | File | Purpose |
|---|---|---|
| `/login` | [Login.tsx](front-end/src/pages/Login.tsx) | Lab ID + admin password gate |
| `/` | [Index.tsx](front-end/src/pages/Index.tsx) → [Dashboard.tsx](front-end/src/components/Dashboard.tsx) | Main live dashboard |
| `*` | [NotFound.tsx](front-end/src/pages/NotFound.tsx) | 404 |

---

## 7. Component Inventory (Front-End)

| Component | Path | Responsibility |
|---|---|---|
| `Dashboard` | [Dashboard.tsx](front-end/src/components/Dashboard.tsx) | Top-level state, Firebase subscription, alert toasts, purge dialog |
| `DashboardHeader` | [DashboardHeader.tsx](front-end/src/components/DashboardHeader.tsx) | Lab badge, online/total counts, alerts bell, download lab report, logout |
| `DeviceCard` | [DeviceCard.tsx](front-end/src/components/DeviceCard.tsx) | Per-device panel: header, current process, process stack, web breakdown / pie |
| `AppUsagePie` | [AppUsagePie.tsx](front-end/src/components/AppUsagePie.tsx) | Recharts donut with active-slice highlight and center HUD |
| `EmptyState` | [EmptyState.tsx](front-end/src/components/EmptyState.tsx) | "No devices yet" placeholder + setup CTA |
| `SetupInstructions` | [SetupInstructions.tsx](front-end/src/components/SetupInstructions.tsx) | Modal with copy-paste Python/env code snippets |
| `StatusIndicator` | [StatusIndicator.tsx](front-end/src/components/StatusIndicator.tsx) | Online/offline dot indicator |
| `NavLink` | [NavLink.tsx](front-end/src/components/NavLink.tsx) | Nav helper |
| `ui/*` | [components/ui/](front-end/src/components/ui/) | shadcn/ui primitives (Button, Dialog, AlertDialog, Input, Badge, Card, Toaster, Sonner, Tooltip, etc.) |

### Hooks & Libs

| File | Purpose |
|---|---|
| [firebase.ts](front-end/src/lib/firebase.ts) | Firebase init, `DeviceData`/`SuspiciousActivityAlert` types, `subscribeToLabDevices`, `deleteDeviceById`, `clearAllAlertsByDeviceIds` |
| [exportUtils.ts](front-end/src/lib/exportUtils.ts) | `exportDeviceToExcel`, `exportLabToExcel` |
| [utils.ts](front-end/src/lib/utils.ts) | `cn()`, `formatTime()`, `getActiveAppLabel()`, `CYBER_COLORS` |
| [use-toast.ts](front-end/src/hooks/use-toast.ts) | shadcn toast hook |
| [use-mobile.tsx](front-end/src/hooks/use-mobile.tsx) | Responsive breakpoint hook |

---

## 8. Tech Stack

### 8.1 Front-End
- **React 18.3**, **TypeScript 5.8**, **Vite 5.4** (SWC plugin).
- **Tailwind CSS 3.4** + `tailwindcss-animate` + `@tailwindcss/typography`.
- **shadcn/ui** (Radix UI primitives) — Accordion, AlertDialog, Dialog, DropdownMenu, Popover, Select, Tabs, Toast, Tooltip, etc.
- **Recharts 2.15** — pie / donut charts.
- **TanStack React Query 5** — query client (mounted but subscription is via Firebase SDK).
- **React Router 6.30** — `/`, `/login`, `*`.
- **Firebase JS SDK 12** — `initializeApp`, `getDatabase`, `onValue`, `remove`.
- **SheetJS (xlsx) 0.18** + **FileSaver 2** — Excel export.
- **lucide-react** — icon set.
- **sonner** + shadcn `Toaster` — dual toast systems.
- **react-hook-form** + **zod** + `@hookform/resolvers` — form plumbing (available via shadcn form).
- **date-fns**, **clsx**, **tailwind-merge**, **class-variance-authority**, **cmdk**, **vaul**, **embla-carousel-react**, **input-otp**, **next-themes**, **react-day-picker**, **react-resizable-panels**.
- **Vitest 3** + **@testing-library/react** + **jsdom** — tests (directory at [src/test/](front-end/src/test/)).
- **ESLint 9** + `typescript-eslint`.

### 8.2 Python Client
- **Python ≥ 3.9**, Windows only.
- **psutil** — process name lookup from PID.
- **firebase-admin** — RTDB writes via service account.
- **ctypes + wintypes** — Win32 API (`GetForegroundWindow`, `GetWindowTextW`, `GetWindowThreadProcessId`).
- **winreg** — auto-start registration.
- **PyInstaller** — packaging (`tracker.spec`).

### 8.3 Backend
- **Firebase Realtime Database** — single source of truth.
- No Cloud Functions, no custom server.

---

## 9. Configuration & Secrets

### 9.1 Python Tracker
| Variable | Default | Purpose |
|---|---|---|
| `TRACKER_LAB_ID` | `"1"` | Lab partition to write into |
| `TRACKER_FIREBASE_KEY` | _(unset)_ | Override path to `serviceAccountKey.json` |

Service account search order: `TRACKER_FIREBASE_KEY` → PyInstaller `_MEIPASS/firebase/` → `BASE_DIR/firebase/` → `BASE_DIR/../firebase/`.

### 9.2 Front-End (`.env`)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```
Note: `databaseURL` is currently hard-coded in [firebase.ts:10](front-end/src/lib/firebase.ts#L10), overriding the env var.

### 9.3 Hard-Coded Constants
- Admin password: `QWERTY123456` (both [Login.tsx](front-end/src/pages/Login.tsx#L9) and [Dashboard.tsx](front-end/src/components/Dashboard.tsx#L50)).
- Valid lab IDs: `["0","1","2","3","4","5","6"]`.
- Online threshold: `15 000 ms`.
- Active-device window: last 12 hours.
- Tracker loop interval: `5 s`.
- Alert cooldown: `60 s`.
- Status-log interval: `30 s`.
- Suspicious keywords: see §3.4 (defined in [tracker.py:105-127](python_client/tracker.py#L105-L127)).

---

## 10. NPM Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build (`dist/`) |
| `npm run build:dev` | Dev-mode build |
| `npm run preview` | Serve built bundle |
| `npm run lint` | ESLint |
| `npm run test` | Vitest single run |
| `npm run test:watch` | Vitest watch mode |

---

## 11. Non-Functional Requirements

- **Latency:** ≤ 5 s from user activity to dashboard UI.
- **Availability:** dashboard survives client going offline (shows OFFLINE state within 15 s).
- **Scalability:** Firebase RTDB scales to hundreds of devices per lab; limiting factor is RTDB concurrent connections (default 100 k).
- **Concurrency:** app_usage and web_usage writes use RTDB transactions to avoid lost-update races across processes.
- **Bundle size:** Vite-built SPA, shadcn tree-shakes unused Radix primitives.
- **Privacy:** all data flows straight to the configured Firebase project; no third-party telemetry.

---

## 12. Known Limitations / Gaps

1. **Client platform:** Windows-only (uses `ctypes.windll`, `winreg`). macOS/Linux would need a new window-detection path.
2. **Password is in source:** admin password and DB URL are client-visible strings — adequate for internal lab use, not internet-exposed deployments.
3. **RTDB rules are `true/true` during setup:** production needs signed-in admin rules or App Check.
4. **Service account key is committed-adjacent:** the tracker expects the file at `python_client/firebase/serviceAccountKey.json` — must be distributed securely with each `.exe`.
5. **Browser tab visibility:** only the *active* tab title is tracked; background tabs are invisible to the Win32 API.
6. **Site key derivation:** uses `" - "` split on window title; some browsers or pages without a dash fall back to the full title.
7. **Requirements file typo:** `python_client/requiremenets.txt` (sic).
8. **Hard-coded Firebase DB URL** in both [tracker.py:89](python_client/tracker.py#L89) and [firebase.ts:10](front-end/src/lib/firebase.ts#L10) — changing projects requires a code edit.
9. **Lab 0 path divergence:** Lab 0 reads/writes `devices/` root; Labs 1–6 use `labs/{id}/devices/`. Don't mix.
10. **Timezone:** all history keys are UTC dates; a device active at local midnight will split across two buckets.

---

## 13. Security Considerations

- **Don't commit** `python_client/firebase/serviceAccountKey.json`; treat it as a production secret per distribution.
- Rotate the admin password (`QWERTY123456`) before any broader deployment — it gates device deletion.
- Tighten RTDB rules once shape is stable: require server-side admin auth for writes; require admin custom claims for deletes.
- Consider adding Firebase App Check on the web side.

---

## 14. Build & Release

### 14.1 Tracker Executable
```bash
cd python_client
pip install pyinstaller
pyinstaller tracker.spec
# dist/tracker.exe (includes bundled firebase/serviceAccountKey.json via spec)
```

### 14.2 Dashboard
```bash
cd front-end
npm install
npm run build
# deploy dist/ to any static host (Firebase Hosting, Netlify, Vercel, etc.)
```

---

## 15. Quick Reference — File Map

```
device-usage-tracker/
├── README.md                       # User-facing overview
├── PRD.md                          # THIS DOCUMENT
├── front-end/
│   ├── index.html
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig*.json
│   ├── eslint.config.js
│   ├── components.json             # shadcn/ui config
│   ├── package.json
│   ├── public/
│   ├── dist/                       # built output
│   └── src/
│       ├── main.tsx                # React root
│       ├── App.tsx                 # Router + providers
│       ├── App.css / index.css     # Global styles + Tailwind layers
│       ├── pages/                  # Index, Login, NotFound
│       ├── components/             # Dashboard, DeviceCard, AppUsagePie, ...
│       ├── components/ui/          # shadcn primitives
│       ├── hooks/                  # use-toast, use-mobile
│       ├── lib/                    # firebase, exportUtils, utils
│       └── test/                   # Vitest suite
└── python_client/
    ├── tracker.py                  # Main agent
    ├── tracker.spec                # PyInstaller build spec
    ├── requiremenets.txt           # pip deps (sic)
    ├── tracker_log.txt             # Runtime error log
    ├── firebase/serviceAccountKey.json   # Admin SDK credentials (gitignore)
    ├── build/ dist/ venv/          # Local build artifacts
```

---

## 16. Glossary

- **Lab** — a logical partition (0–6). Each lab has its own subtree in Firebase and its own dashboard view.
- **Device** — a single Windows machine identified by `{LAB_ID}-{hostname}-{MAC}`.
- **Heartbeat** — the 5-second write to `current/` that makes a device appear online.
- **Suspicious Activity** — active app/site matching any keyword in the curated list; surfaces as a toast + alert record.
- **Purge** — admin-initiated deletion of a device's entire Firebase node (`labs/{id}/devices/{deviceId}` or `devices/{deviceId}` for Lab 0).
