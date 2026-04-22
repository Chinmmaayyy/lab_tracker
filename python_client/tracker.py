import time
import uuid
import socket
from datetime import datetime
import ctypes
from ctypes import wintypes
import psutil
import firebase_admin
from firebase_admin import credentials, db
import os
import sys
import winreg

# ==================================================
# LOGGING & PATHS
# ==================================================
if getattr(sys, "frozen", False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

LOG_FILE = os.path.join(BASE_DIR, "tracker_log.txt")

def log_error(msg):
    print(f"[ERROR] {msg}")
    with open(LOG_FILE, "a") as f:
        f.write(f"{datetime.now()} : {msg}\n")


def log_info(msg):
    print(f"[INFO] {msg}")

def resource_path(relative_path):
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = BASE_DIR
    return os.path.join(base_path, relative_path)


def find_service_key_path():
    env_path = os.getenv("TRACKER_FIREBASE_KEY", "").strip()
    candidates = []

    if env_path:
        candidates.append(env_path)

    candidates.extend([
        resource_path("firebase/serviceAccountKey.json"),
        os.path.join(BASE_DIR, "firebase", "serviceAccountKey.json"),
        os.path.join(os.path.dirname(BASE_DIR), "firebase", "serviceAccountKey.json"),
    ])

    for candidate in candidates:
        if os.path.isfile(candidate):
            return candidate

    return None

# ==================================================
# AUTO-START WITH WINDOWS
# ==================================================
def add_to_startup():
    try:
        exe_path = sys.executable
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Run",
            0,
            winreg.KEY_SET_VALUE
        )
        winreg.SetValueEx(key, "DeviceUsageTracker", 0, winreg.REG_SZ, exe_path)
        winreg.CloseKey(key)
    except Exception as e:
        log_error(f"Startup error: {e}")

# ==================================================
# FIREBASE INIT
# ==================================================
def init_firebase():
    try:
        service_key = find_service_key_path()
        if not service_key:
            log_error("Firebase init failed: serviceAccountKey.json not found")
            return False

        cred = credentials.Certificate(service_key)
        firebase_admin.initialize_app(cred, {
            "databaseURL": "https://fir-os-dc607-default-rtdb.firebaseio.com"
        })

        # Validate credentials and DB access at startup for fast failure signals.
        db.reference("__healthcheck").child("startup_probe").get()
        log_info(f"Firebase initialized using key: {service_key}")
        return True
    except Exception as e:
        log_error(f"Firebase init failed: {e}")
        return False

# ==================================================
# CONFIGURATION
# ==================================================
LAB_ID = os.getenv("TRACKER_LAB_ID", "1").strip() or "1"

SUSPICIOUS_KEYWORDS = [
    # AI Tools
    "chatgpt", "openai", "gpt", "google gemini", "bard", "claude",
    "copilot", "blackbox", "phind", "perplexity", "poe",

    # Writing/Docs tools
    "google docs", "docs.google", "notion", "notion ai",

    # Search engines (optional cheating context)
    "google", "bing", "yahoo",

    # Coding help platforms
    "stackoverflow", "github", "geeksforgeeks", "w3schools",

    # Communication / sharing
    "whatsapp web", "web.whatsapp", "telegram", "discord",

    # File sharing / external help
    "drive.google", "dropbox",

    # Others
    "quora", "reddit"
]

ALERT_COOLDOWN = 60  # seconds

# ==================================================
# UTILS
# ==================================================
def get_device_id():
    # Prepend LAB_ID for sorting
    return f"{LAB_ID}-{socket.gethostname()}-{uuid.getnode()}"

def sanitize_key(key: str) -> str:
    if not key or key.strip() == "":
        return "Unknown"
    for ch in ".#$[]/":
        key = key.replace(ch, "_")
    return key.strip()


def is_suspicious(app, website):
    text = f"{app} {website}".lower() if website else app.lower()
    return any(keyword in text for keyword in SUSPICIOUS_KEYWORDS)

# ==================================================
# ACTIVE WINDOW DETECTION
# ==================================================
def get_active_window():
    try:
        user32 = ctypes.windll.user32
        hwnd = user32.GetForegroundWindow()

        if not hwnd or not user32.IsWindowVisible(hwnd):
            return "Idle", None

        # Window title
        length = user32.GetWindowTextLengthW(hwnd)
        buf = ctypes.create_unicode_buffer(length + 1)
        user32.GetWindowTextW(hwnd, buf, length + 1)
        title = buf.value

        # Process name
        pid = wintypes.DWORD()
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        process = psutil.Process(pid.value)
        app = process.name().replace(".exe", "").lower()

        website = None
        if app in ["msedge", "chrome", "brave", "firefox"]:
            if " - " in title:
                website = title.rsplit(" - ", 1)[0]
            else:
                website = title

        return app, website

    except Exception as e:
        log_error(f"Window detect error: {e}")
        return "Unknown", None

# ==================================================
# MAIN TRACKER LOOP (FIXED)
# ==================================================
def start_tracker():
    device_id = get_device_id()
    # Structure: labs/{LAB_NOS}/devices/{device_id}
    device_ref = db.reference(f"labs/{LAB_ID}/devices/{device_id}")
    log_info(f"Tracker started for lab={LAB_ID}, device_id={device_id}")

    last_app = None
    last_website = None
    last_time = time.time()
    last_alert_time = 0
    last_status_log = 0

    while True:
        try:
            today = datetime.utcnow().strftime("%Y-%m-%d")
            daily_ref = device_ref.child(f"history/{today}")

            current_app, current_website = get_active_window()
            now = time.time()
            elapsed = int(now - last_time)

            # Cooldowned realtime suspicious activity alert
            if is_suspicious(current_app, current_website):
                if now - last_alert_time > ALERT_COOLDOWN:
                    try:
                        device_ref.child("alerts").push({
                            "type": "suspicious_activity",
                            "app": current_app,
                            "website": current_website,
                            "timestamp": datetime.utcnow().isoformat() + "Z"
                        })
                        last_alert_time = now
                    except Exception as alert_error:
                        # Alert errors should not interrupt the main tracker loop.
                        log_error(f"Alert push error: {alert_error}")

            if last_app and elapsed > 0:
                app_key = sanitize_key(last_app)

                # 1️⃣ App usage
                daily_ref.child(f"app_usage/{app_key}").transaction(
                    lambda x: (x or 0) + elapsed
                )

                # 2️⃣ Browser-specific web usage (FIXED)
                if last_website:
                    site_key = sanitize_key(last_website)
                    daily_ref.child(
                        f"web_usage/{app_key}/{site_key}"
                    ).transaction(lambda x: (x or 0) + elapsed)

                # 3️⃣ Total screen time
                daily_ref.child("total_screen_time").transaction(
                    lambda x: (x or 0) + elapsed
                )

            # 4️⃣ Realtime status
            device_ref.child("current").set({
                "app": current_app,
                "website": current_website,
                "last_updated": datetime.utcnow().isoformat() + "Z"
            })

            if now - last_status_log >= 30:
                site_text = current_website if current_website else "-"
                log_info(f"Live heartbeat sent | app={current_app} | site={site_text}")
                last_status_log = now

            last_app = current_app
            last_website = current_website
            last_time = now

            time.sleep(5)

        except Exception as e:
            log_error(f"Runtime error: {e}")
            time.sleep(10)

# ==================================================
# ENTRY POINT
# ==================================================
if __name__ == "__main__":
    if getattr(sys, "frozen", False):
        add_to_startup()

    if not init_firebase():
        log_error(
            "Tracker stopped: Firebase auth failed. Check service account key validity or generate a new key."
        )
        raise SystemExit(1)

    start_tracker()