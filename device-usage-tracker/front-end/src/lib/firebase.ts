import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, DatabaseReference } from 'firebase/database';

// Firebase configuration - Replace with your own config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://demo-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:000000000000"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export interface UsageLog {
  device_id: string;
  app_name: string;
  timestamp: string;
}

export interface DeviceData {
  device_id: string;
  latest_app: string;
  last_updated: string;
  is_online: boolean;
}

// Get reference to all devices
export const getDevicesRef = (): DatabaseReference => {
  return ref(database, 'devices');
};

// Subscribe to real-time updates for all devices
export const subscribeToDevices = (callback: (devices: Record<string, DeviceData>) => void) => {
  const devicesRef = getDevicesRef();
  
  return onValue(devicesRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const devices: Record<string, DeviceData> = {};
      
      Object.keys(data).forEach((deviceId) => {
        const deviceData = data[deviceId];
        const usageLogs = deviceData.usage_logs;
        
        if (usageLogs) {
          // Get the latest log entry
          const logKeys = Object.keys(usageLogs);
          const latestKey = logKeys[logKeys.length - 1];
          const latestLog = usageLogs[latestKey] as UsageLog;
          
          // Check if device is online (updated within last 30 seconds)
          const lastUpdate = new Date(latestLog.timestamp);
          const now = new Date();
          const isOnline = (now.getTime() - lastUpdate.getTime()) < 30000;
          
          devices[deviceId] = {
            device_id: deviceId,
            latest_app: latestLog.app_name,
            last_updated: latestLog.timestamp,
            is_online: isOnline
          };
        }
      });
      
      callback(devices);
    } else {
      callback({});
    }
  });
};

export { database };
