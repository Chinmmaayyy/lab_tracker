import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, remove } from "firebase/database";

/* ======================================
    FIREBASE CONFIGURATION
====================================== */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY!,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN!,
  databaseURL: "https://fir-os-dc607-default-rtdb.firebaseio.com", 
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
  alerts?: Record<string, SuspiciousActivityAlert>;
  history?: Record<string, unknown>; 
}

export interface SuspiciousActivityAlert {
  type: "suspicious_activity";
  app?: string;
  website?: string;
  timestamp: string;
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
  alerts?: Record<string, SuspiciousActivityAlert>;
}

/* ======================================
    REAL-TIME DATA SUBSCRIPTION
====================================== */
export const subscribeToLabDevices = (
  labId: string,
  callback: (devices: Record<string, DeviceData>) => void
) => {
  // LAB 0 fetches from root 'devices' (Legacy compatibility as requested)
  // Others fetch from 'labs/LAB_NO/devices'
  const path = (labId === "0") ? "devices" : `labs/${labId}/devices`;
  const devicesRef = ref(database, path);

  return onValue(devicesRef, (snapshot) => {
    const data = snapshot.val() as Record<string, FirebaseDeviceNode> | null;

    if (!data) {
      callback({});
      return;
    }

    const devices: Record<string, DeviceData> = {};

    Object.entries(data).forEach(([deviceId, deviceData]) => {
      const lastUpdated = deviceData.current?.last_updated || "";
      
      const isOnline = lastUpdated && 
        (Date.now() - new Date(lastUpdated).getTime() < 15000);

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
        web_usage: stats.web_usage || {}, 
        alerts: deviceData.alerts || {},
        history: deviceData.history, 
      };
    });

    callback(devices);
  });
};

/* ======================================
    ADMIN ACTIONS: DELETE NODE
====================================== */
export const deleteDeviceById = async (labId: string, deviceId: string) => {
  try {
    const path = (labId === "0") ? `devices/${deviceId}` : `labs/${labId}/devices/${deviceId}`;
    const deviceRef = ref(database, path);
    await remove(deviceRef);
  } catch (error) {
    console.error("CRITICAL_FIREBASE_ERROR:", error);
    throw error;
  }
};

export const clearAllAlertsByDeviceIds = async (labId: string, deviceIds: string[]) => {
  try {
    if (deviceIds.length === 0) {
      return;
    }

    await Promise.all(
      deviceIds.map((deviceId) => {
        const path = (labId === "0")
          ? `devices/${deviceId}/alerts`
          : `labs/${labId}/devices/${deviceId}/alerts`;
        return remove(ref(database, path));
      })
    );
  } catch (error) {
    console.error("CRITICAL_FIREBASE_ERROR:", error);
    throw error;
  }
};