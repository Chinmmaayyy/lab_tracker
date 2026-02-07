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
cred = credentials.Certificate("firebase/serviceAccountKey.json")

firebase_admin.initialize_app(cred, {
    "databaseURL": "https://fir-os-dc607-default-rtdb.firebaseio.com"
})

# ---------------- DEVICE ID ----------------
def get_device_id():
    return f"{socket.gethostname()}-{uuid.getnode()}"

# ---------------- ACTIVE WINDOW ----------------
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
        app = process.name().replace(".exe", "")
    except:
        app = "Unknown"

    website = None
    if app.lower() in ["msedge", "chrome"]:
        website = title.split(" - ")[0]

    return app, website

# ---------------- MAIN TRACKER ----------------
def start_tracker():
    device_id = get_device_id()
    base_ref = db.reference(f"devices/{device_id}")

    last_app = None
    last_time = time.time()

    while True:
        current_app, website = get_active_window()
        now = time.time()
        elapsed = int(now - last_time)

        # Update totals
        if last_app:
            base_ref.child(f"app_usage/{last_app}").transaction(
                lambda x: (x or 0) + elapsed
            )

            base_ref.child("device_stats/total_screen_time").transaction(
                lambda x: (x or 0) + elapsed
            )

        if website:
            base_ref.child(f"web_usage/{website}").transaction(
                lambda x: (x or 0) + elapsed
            )

        # Update current status
        base_ref.child("current").set({
            "app": current_app,
            "website": website,
            "last_updated": datetime.utcnow().isoformat()
        })

        last_app = current_app
        last_time = now
        time.sleep(5)

# ---------------- RUN ----------------
if __name__ == "__main__":
    print("Device Usage Tracker running...")
    start_tracker()
    
