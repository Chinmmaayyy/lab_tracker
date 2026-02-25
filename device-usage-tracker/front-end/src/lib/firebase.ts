import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

/* =======================
   FIREBASE CONFIG
======================= */
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

/* =======================
   TYPES
======================= */
export type DeviceData = {
  latest_app: string;
  device_id: string;
  current_app: string;
  website?: string;
  last_updated: string;
  is_online: boolean;
  total_screen_time: number;
  app_usage: Record<string, number>;
  web_usage: Record<string, number>;
};

type FirebaseDeviceRaw = {
  current?: {
    app?: string;
    website?: string;
    last_updated?: string;
  };
  device_stats?: {
    total_screen_time?: number;
  };
  app_usage?: Record<string, number>;
  web_usage?: Record<string, number>;
};

/* =======================
   REALTIME SUBSCRIPTION
======================= */
export const subscribeToDevices = (
  callback: (devices: Record<string, DeviceData>) => void
) => {
  const rootRef = ref(database, "devices");

  return onValue(rootRef, (snapshot) => {
    const data = snapshot.val();

    if (!data) {
      callback({});
      return;
    }

    const devices: Record<string, DeviceData> = {};

    Object.entries(data as Record<string, FirebaseDeviceRaw>).forEach(
      ([deviceId, deviceData]) => {
        const lastUpdated = deviceData.current?.last_updated;

        // Parse timestamp and determine online status (15s heartbeat)
        const lastUpdateTime = lastUpdated ? new Date(lastUpdated).getTime() : 0;
        const isOnline = Date.now() - lastUpdateTime < 15_000;

        devices[deviceId] = {
          device_id: deviceId,
          current_app: deviceData.current?.app || "Unknown",
          website: deviceData.current?.website,
          last_updated: lastUpdated || new Date().toISOString(),
          is_online: isOnline,
          total_screen_time: deviceData.device_stats?.total_screen_time || 0,
          app_usage: deviceData.app_usage || {},
          web_usage: deviceData.web_usage || {},
        };
      }
    );

    callback(devices);
  });
};
