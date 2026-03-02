import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, remove } from "firebase/database";

/* ======================================
    FIREBASE CONFIGURATION
====================================== */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY!,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN!,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL!,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID!,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
  appId: import.meta.env.VITE_FIREBASE_APP_ID!,
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);

/* ======================================
    FRONTEND DATA TYPES
====================================== */
export interface DeviceData {
  device_id: string;
  current_app: string;
  website?: string;
  last_updated: string;
  is_online: boolean;
  total_screen_time: number;
  app_usage: Record<string, number>;
  web_usage: Record<string, Record<string, number>>; 
}

interface FirebaseDeviceNode {
  current?: {
    app?: string;
    website?: string;
    last_updated?: string;
  };
  history?: Record<string, {
    total_screen_time?: number;
    app_usage?: Record<string, number>;
    web_usage?: Record<string, Record<string, number>>;
  }>;
}

/* ======================================
    REAL-TIME DATA SUBSCRIPTION
====================================== */
export const subscribeToDevices = (
  callback: (devices: Record<string, DeviceData>) => void
) => {
  const devicesRef = ref(database, "devices");

  return onValue(devicesRef, (snapshot) => {
    const data = snapshot.val() as Record<string, FirebaseDeviceNode> | null;

    if (!data) {
      callback({});
      return;
    }

    const devices: Record<string, DeviceData> = {};

    Object.entries(data).forEach(([deviceId, deviceData]) => {
      const lastUpdated = deviceData.current?.last_updated || "";
      
      // Node is online if updated in the last 15 seconds
      const isOnline = lastUpdated && 
        (Date.now() - new Date(lastUpdated).getTime() < 15000);

      // --- PIE CHART FIX: DYNAMIC DATE SELECTION ---
      // Instead of hardcoding "today", we grab the most recent date available in history
      const historyDates = deviceData.history ? Object.keys(deviceData.history).sort().reverse() : [];
      const latestDateKey = historyDates[0]; 
      const stats = latestDateKey ? deviceData.history![latestDateKey] : {};

      devices[deviceId] = {
        device_id: deviceId,
        current_app: deviceData.current?.app || "Idle",
        website: deviceData.current?.website,
        last_updated: lastUpdated,
        is_online: Boolean(isOnline),
        total_screen_time: stats.total_screen_time || 0,
        app_usage: stats.app_usage || {},
        web_usage: stats.web_usage || {}, // Maps the nested web usage structure
      };
    });

    callback(devices);
  });
};

/* ======================================
    ADMIN ACTIONS: DELETE NODE
====================================== */
export const deleteDeviceById = async (deviceId: string) => {
  try {
    const deviceRef = ref(database, `devices/${deviceId}`);
    await remove(deviceRef); // Permanently removes the device node from Firebase
  } catch (error) {
    console.error("CRITICAL_FIREBASE_ERROR:", error);
    throw error;
  }
};
