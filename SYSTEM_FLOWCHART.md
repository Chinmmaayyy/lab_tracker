# Device Usage Tracking System - System Flowchart

## Vertical Flow (Project-Refined)

```mermaid
graph TD
    %% Core nodes
    A([Start]) --> B[💻 Student PC / User Device]
    B --> C[⚙️ Background EXE Tracker auto-runs on startup]
    C --> D[🪟 Detect active foreground app and window title]
    D --> E[🌐 Identify browser activity: Chrome, Edge, Brave, Firefox]
    E --> F[⏱️ Track usage counters:<br/>app_usage, web_usage, total_screen_time]
    F --> G{🚨 Suspicious / cheating activity?}

    %% Suspicious path
    G -- Yes --> H[🔎 Match suspicious keywords:<br/>ChatGPT, Gemini, Google Docs,<br/>AI tools or unauthorized websites]
    H --> I[📤 Push alert to Firebase RTDB<br/>alerts/{auto_id}]
    I --> J[🛡️ Admin Alert System triggered]
    J --> K[📣 Show popup toast on Admin Dashboard]
    J --> L[🔊 Play alert sound on Admin side<br/>(optional enhancement)]
    K --> M[🔥 Firebase Realtime Database]
    L --> M

    %% Normal path
    G -- No --> N[✅ Continue normal tracking loop]
    N --> M

    %% Storage model
    M --> O[🗂️ Store by lab + device:<br/>labs/{labId}/devices/{deviceId}]
    O --> O1[current: app, website, last_updated]
    O --> O2[history/{YYYY-MM-DD}]
    O2 --> O3[app_usage]
    O2 --> O4[web_usage]
    O2 --> O5[total_screen_time]

    %% Admin dashboard
    M --> P[🖥️ Admin Dashboard Frontend]
    P --> P1[Real-time device monitoring]
    P --> P2[Online/Offline via 15s heartbeat rule]
    P --> P3[Pie chart of app usage]
    P --> P4[Click app to inspect detailed usage]
    P --> P5[Lab-wise filtering: LAB 0-6]

    %% Admin actions
    P --> Q[👨‍💼 Admin Actions]
    Q --> Q1[Download Excel report]
    Q --> Q2[Delete device with admin password]
    Q --> Q3[SAVE_&_PURGE option]
    Q --> R([End])

    %% Style definitions (dark tech)
    classDef base fill:#0b1220,stroke:#2dd4bf,color:#e2e8f0,stroke-width:1.2px;
    classDef db fill:#111827,stroke:#22d3ee,color:#e5e7eb,stroke-width:1.4px;
    classDef cheat fill:#3a0a0a,stroke:#ef4444,color:#ffe4e6,stroke-width:2px;
    classDef decision fill:#1f2937,stroke:#f59e0b,color:#fef3c7,stroke-width:1.5px;

    class A,B,C,D,E,F,N,O,O1,O2,O3,O4,O5,P,P1,P2,P3,P4,P5,Q,Q1,Q2,Q3,R base;
    class M db;
    class G decision;
    class H,I,J,K,L cheat;
```

## Implementation Notes (Aligned To Current Project)

- Tracker loop runs every 5 seconds and updates current activity plus daily history.
- Suspicious alerts are cooldown-limited before pushing to Firebase alerts node.
- Dashboard already shows popup alerts (toast).
- Alert sound is marked optional because current implementation focuses on visual popup alerts.
- Data path uses lab-scoped routing; LAB 0 has legacy root path compatibility in frontend subscription logic.
