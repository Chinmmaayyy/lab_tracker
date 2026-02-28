import { X, Terminal, Database, Globe, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface SetupInstructionsProps {
  onClose: () => void;
}

const CodeBlock = ({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <Badge variant="secondary" className="text-xs font-mono">
          {language}
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          onClick={copyToClipboard}
          className="h-7 w-7 p-0"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-success" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <pre className="p-4 pt-10 rounded-lg bg-background border border-border overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const pythonClientCode = `# python_client/tracker.py
import time
import uuid
import json
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, db

# Windows API for active window
import ctypes
from ctypes import wintypes

# Initialize Firebase
cred = credentials.Certificate("path/to/serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://YOUR-PROJECT.firebaseio.com'
})

def get_active_app_name():
    """Get the currently active application name on Windows."""
    user32 = ctypes.windll.user32
    h_wnd = user32.GetForegroundWindow()
    
    pid = wintypes.DWORD()
    user32.GetWindowThreadProcessId(h_wnd, ctypes.byref(pid))
    
    # Get process name
    import psutil
    try:
        process = psutil.Process(pid.value)
        return process.name().replace('.exe', '')
    except:
        return "Unknown"

def get_device_id():
    """Generate or retrieve a unique device ID."""
    import socket
    hostname = socket.gethostname()
    return f"{hostname}-{uuid.getnode()}"[:20]

def send_usage_data():
    """Send usage data to Firebase."""
    device_id = get_device_id()
    ref = db.reference(f'devices/{device_id}/usage_logs')
    
    while True:
        app_name = get_active_app_name()
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        data = {
            "device_id": device_id,
            "app_name": app_name,
            "timestamp": timestamp
        }
        
        ref.push(data)
        print(f"Sent: {app_name} at {timestamp}")
        
        time.sleep(5)  # Update every 5 seconds

if __name__ == "__main__":
    print("Starting Device Usage Tracker...")
    send_usage_data()`;

const osApiCode = `# os_api/windows_api.py
import ctypes
from ctypes import wintypes
import psutil

def get_active_app_name() -> str:
    """
    Get the currently active application name on Windows.
    Uses Win32 API to get foreground window and process info.
    """
    try:
        user32 = ctypes.windll.user32
        
        # Get handle to foreground window
        h_wnd = user32.GetForegroundWindow()
        
        if not h_wnd:
            return "Desktop"
        
        # Get process ID
        pid = wintypes.DWORD()
        user32.GetWindowThreadProcessId(h_wnd, ctypes.byref(pid))
        
        # Get process name from PID
        process = psutil.Process(pid.value)
        app_name = process.name()
        
        # Clean up the name
        if app_name.endswith('.exe'):
            app_name = app_name[:-4]
        
        return app_name
        
    except Exception as e:
        return "Unknown"

def get_window_title() -> str:
    """Get the title of the active window."""
    try:
        user32 = ctypes.windll.user32
        h_wnd = user32.GetForegroundWindow()
        
        length = user32.GetWindowTextLengthW(h_wnd)
        buf = ctypes.create_unicode_buffer(length + 1)
        user32.GetWindowTextW(h_wnd, buf, length + 1)
        
        return buf.value
    except:
        return ""`;

const requirementsCode = `# requirements.txt
firebase-admin>=6.0.0
psutil>=5.9.0`;

export const SetupInstructions = ({ onClose }: SetupInstructionsProps) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-auto">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-border/50 bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl text-gradient">
              Setup Instructions
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Step 1: Firebase Setup */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold">
                  1
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Firebase Setup</h3>
                </div>
              </div>
              
              <div className="ml-11 space-y-3 text-muted-foreground">
                <ol className="list-decimal list-inside space-y-2">
                  <li>Go to <a href="https://console.firebase.google.com" target="_blank" className="text-primary hover:underline">Firebase Console</a></li>
                  <li>Create a new project or select an existing one</li>
                  <li>Enable Realtime Database (not Firestore)</li>
                  <li>Set database rules to allow read/write (for testing):</li>
                </ol>
                <CodeBlock 
                  code={`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}
                  language="json"
                />
                <ol className="list-decimal list-inside space-y-2" start={5}>
                  <li>Go to Project Settings → Service Accounts</li>
                  <li>Generate a new private key (download JSON file)</li>
                </ol>
              </div>
            </section>

            {/* Step 2: Python Environment */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold">
                  2
                </div>
                <div className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Python Environment</h3>
                </div>
              </div>
              
              <div className="ml-11 space-y-4">
                <p className="text-muted-foreground">Install required packages:</p>
                <CodeBlock code={requirementsCode} language="txt" />
                <CodeBlock code="pip install -r requirements.txt" language="bash" />
              </div>
            </section>

            {/* Step 3: OS API Module */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold">OS API Module (Windows)</h3>
              </div>
              
              <div className="ml-11">
                <CodeBlock code={osApiCode} language="python" />
              </div>
            </section>

            {/* Step 4: Python Client */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold">
                  4
                </div>
                <h3 className="text-lg font-semibold">Python Client</h3>
              </div>
              
              <div className="ml-11 space-y-3">
                <p className="text-muted-foreground">
                  Update the Firebase config and service account path, then run:
                </p>
                <CodeBlock code={pythonClientCode} language="python" />
              </div>
            </section>

            {/* Step 5: Configure Dashboard */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold">
                  5
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Configure Dashboard</h3>
                </div>
              </div>
              
              <div className="ml-11 space-y-3 text-muted-foreground">
                <p>Set environment variables for this dashboard:</p>
                <CodeBlock 
                  code={`VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef`}
                  language="env"
                />
              </div>
            </section>

            {/* Run Instructions */}
            <section className="p-4 rounded-lg bg-success/10 border border-success/20">
              <h4 className="font-semibold text-success mb-2">Ready to Run!</h4>
              <p className="text-sm text-muted-foreground">
                Start the Python client on your Windows machine: <code className="font-mono bg-background px-2 py-1 rounded">python tracker.py</code>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                The dashboard will automatically display connected devices in real-time.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
