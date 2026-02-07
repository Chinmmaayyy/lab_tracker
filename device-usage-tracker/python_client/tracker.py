import time
import uuid
from datetime import datetime
import socket
import ctypes
from ctypes import wintypes

import psutil
import firebase_admin
from firebase_admin import credentials, db

# Firebase setup
cred = credentials.Certificate("firebase/serviceAccountKey.json")

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://fir-os-dc607-default-rtdb.firebaseio.com/'
    })

def get_active_app_name():
    user32 = ctypes.windll.user32
    h_wnd = user32.GetForegroundWindow()

    pid = wintypes.DWORD()
    user32.GetWindowThreadProcessId(h_wnd, ctypes.byref(pid))

    try:
        process = psutil.Process(pid.value)
        return process.name().replace('.exe', '')
    except Exception as e:
        print("Process error:", e)
        return "Unknown"

def get_device_id():
    hostname = socket.gethostname()
    return f"{hostname}-{uuid.getnode()}"[:20]

def send_usage_data():
    device_id = get_device_id()
    ref = db.reference(f"devices/{device_id}/usage_logs")

    while True:
        app_name = get_active_app_name()
        timestamp = datetime.utcnow().isoformat() + "Z"

        data = {
            "device_id": device_id,
            "app_name": app_name,
            "timestamp": timestamp
        }

        ref.push(data)
        print(f"Sent: {app_name} at {timestamp}")

        time.sleep(5)

if __name__ == "__main__":
    print("Starting Device Usage Tracker...")
    send_usage_data()
