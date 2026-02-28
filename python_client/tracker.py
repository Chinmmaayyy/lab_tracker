import time
import uuid
import socket
from datetime import datetime
import ctypes
from ctypes import wintypes
import psutil
import firebase_admin
from firebase_admin import credentials, db

# ---------------- FIREBASE SETUP ----------------
# Ensure your serviceAccountKey.json is in the correct directory
cred = credentials.Certificate("firebase/serviceAccountKey.json")

firebase_admin.initialize_app(cred, {
    "databaseURL": "https://fir-os-dc607-default-rtdb.firebaseio.com"
})

# ---------------- UTILS & SANITIZATION ----------------
def get_device_id():
    return f"{socket.gethostname()}-{uuid.getnode()}"

def sanitize_key(key: str) -> str:
    """
    Firebase keys cannot contain: . # $ [ ] /
    This prevents the ValueError: Path contains illegal characters.
    """
    if not key:
        return "Unknown"
    
    return (
        key.replace(".", "_")
           .replace("#", "_")
           .replace("$", "_")
           .replace("[", "_")
           .replace("]", "_")
           .replace("/", "_")
    )

# ---------------- ACTIVE WINDOW TRACKING ----------------
def get_active_window():
    user32 = ctypes.windll.user32
    hwnd = user32.GetForegroundWindow()

    length = user32.GetWindowTextLengthW(hwnd)
    buf = ctypes.create_unicode_buffer(length + 1)
    user32.GetWindowTextW(hwnd, buf, length + 1)
    title = buf.value

    pid = wintypes.DWORD()
    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))

    try:
        process = psutil.Process(pid.value)
        # Remove .exe for cleaner database keys
        app = process.name().replace(".exe", "")
    except Exception:
        app = "Unknown"

    website = None
    if app.lower() in ["msedge", "chrome", "brave"]:
        # Simple parsing for browser titles
        if " - " in title:
            website = title.split(" - ")[0]

    return app, website

# ---------------- MAIN TRACKER LOOP ----------------
def start_tracker():
    device_id = get_device_id()
    base_ref = db.reference(f"devices/{device_id}")

    last_app = None
    last_website = None
    last_time = time.time()

    print(f"Tracking started for device: {device_id}")

    while True:
        current_app, current_website = get_active_window()
        now = time.time()
        elapsed = int(now - last_time)

        # 1. Update totals for the app that was JUST active
        if last_app and elapsed > 0:
            safe_app = sanitize_key(last_app)
            base_ref.child(f"app_usage/{safe_app}").transaction(
                lambda x: (x or 0) + elapsed
            )

            if last_website:
                safe_web = sanitize_key(last_website)
                base_ref.child(f"web_usage/{safe_web}").transaction(
                    lambda x: (x or 0) + elapsed
                )

            base_ref.child("device_stats/total_screen_time").transaction(
                lambda x: (x or 0) + elapsed
            )

        # 2. Update CURRENT real-time status
        # Using utcnow with 'Z' ensures the frontend heartbeat (Date.now()) matches perfectly
        base_ref.child("current").set({
            "app": current_app,
            "website": current_website,
            "last_updated": datetime.utcnow().isoformat() + 'Z'
        })

        # 3. Rotate variables for next loop
        last_app = current_app
        last_website = current_website
        last_time = now
        
        time.sleep(5)

if __name__ == "__main__":
    try:
        start_tracker()
    except KeyboardInterrupt:
        print("\nTracker stopped.")
