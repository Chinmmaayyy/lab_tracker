# Device Usage Tracker

A real-time device usage monitoring system that tracks application and website activity on Windows machines and displays it on a live web dashboard. Built with a **Python background client** for data collection and a **React + TypeScript** front-end for visualization.

---

## Overview

| Component | Tech Stack |
|---|---|
| **Tracker Client** | Python, `psutil`, `firebase-admin`, Windows API (`ctypes`) |
| **Web Dashboard** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts |
| **Backend / DB** | Firebase Realtime Database |

### How It Works

1. The **Python client** runs silently on a Windows machine, detecting the active foreground window every 5 seconds using the Win32 API.
2. It logs the **application name**, **browser tab title** (for supported browsers), and **total screen time** to Firebase Realtime Database, organized by date.
3. The **React dashboard** subscribes to Firebase in real-time, displaying per-device cards with online/offline status, app usage breakdowns, web usage per browser, and interactive pie charts.

---

## Features

- **Real-time monitoring** — Live updates via Firebase with online/offline status detection (15-second heartbeat).
- **Per-app usage tracking** — Tracks time spent in each application with friendly process name aliases.
- **Browser-specific web usage** — Logs visited page titles per browser (Edge, Chrome, Brave, Firefox).
- **Daily history** — Usage data is bucketed by date under `history/{YYYY-MM-DD}` in Firebase.
- **Interactive pie charts** — Visualize app usage distribution with Recharts.
- **Excel export** — Download per-device reports (daily summary, app logs, web logs) as `.xlsx` files.
- **Admin device deletion** — Password-protected device removal with optional data backup.
- **Auto-start on Windows** — The Python client registers itself in the Windows startup registry when running as a compiled `.exe`.
- **Responsive cyber-themed UI** — Dark-themed dashboard built with Tailwind CSS and shadcn/ui components.

---

## Project Structure

```
device-usage-tracker/
├── front-end/                  # React web dashboard
│   ├── src/
│   │   ├── components/         # UI components (Dashboard, DeviceCard, AppUsagePie, etc.)
│   │   ├── lib/
│   │   │   ├── firebase.ts     # Firebase config, data types & real-time subscription
│   │   │   ├── exportUtils.ts  # Excel export logic
│   │   │   └── utils.ts        # Shared utilities
│   │   └── pages/              # Route pages
│   ├── package.json
│   └── vite.config.ts
│
├── python_client/              # Windows background tracker
│   ├── tracker.py              # Main tracking script
│   ├── requiremenets.txt       # Python dependencies
│   ├── DeviceUsageTracker.spec # PyInstaller build spec
│   └── firebase/
│       └── serviceAccountKey.json  # Firebase service account (not committed)
│
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 and **npm** (for the front-end)
- **Python** ≥ 3.9 (for the tracker client)
- A **Firebase project** with Realtime Database enabled

### 1. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Realtime Database**.
3. Generate a **Service Account Key** (Project Settings → Service Accounts → Generate New Private Key) and save it as `python_client/firebase/serviceAccountKey.json`.
4. Note your **Firebase config values** (API key, auth domain, database URL, etc.) for the front-end.

### 2. Front-End (Web Dashboard)

```bash
cd front-end
npm install
```

Create a `.env` file in the `front-end/` directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

### 3. Python Tracker Client

```bash
cd python_client
pip install -r requiremenets.txt
```

Run the tracker:

```bash
python tracker.py
```

#### Building a Standalone Executable

Use [PyInstaller](https://pyinstaller.org/) to create a single `.exe` that runs without Python installed:

```bash
pip install pyinstaller
pyinstaller DeviceUsageTracker.spec
```

The output executable will be in the `dist/` folder. When launched as a compiled `.exe`, the tracker automatically adds itself to Windows startup.

---

## Firebase Data Structure

```
devices/
└── {device_id}/
    ├── current/
    │   ├── app: "chrome"
    │   ├── website: "GitHub - Dashboard"
    │   └── last_updated: "2026-03-12T10:30:00Z"
    └── history/
        └── 2026-03-12/
            ├── total_screen_time: 14400    # seconds
            ├── app_usage/
            │   ├── chrome: 7200
            │   ├── code: 5400
            │   └── explorer: 1800
            └── web_usage/
                └── chrome/
                    ├── GitHub - Dashboard: 3600
                    └── Stack Overflow: 3600
```

---

## Available Scripts (Front-End)

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |

---

## Tech Stack Details

**Front-End:**
- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) — Build tool
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) — Component library (Radix UI primitives)
- [Recharts](https://recharts.org/) — Charting library
- [TanStack Query](https://tanstack.com/query) — Data fetching
- [SheetJS (xlsx)](https://sheetjs.com/) + [FileSaver.js](https://github.com/nicedaycode/FileSaver.js) — Excel export

**Python Client:**
- [psutil](https://github.com/giampaolo/psutil) — Process utilities
- [firebase-admin](https://firebase.google.com/docs/admin/setup) — Firebase Admin SDK
- [ctypes](https://docs.python.org/3/library/ctypes.html) — Windows API bindings
- [PyInstaller](https://pyinstaller.org/) — Executable packaging

---

## License

This project is for personal/educational use.
