import { useEffect, useState } from "react";
import { DashboardHeader } from "./DashboardHeader";
import { DeviceCard } from "./DeviceCard";
import { EmptyState } from "./EmptyState";
import { SetupInstructions } from "./SetupInstructions";
import { subscribeToDevices, DeviceData } from "@/lib/firebase";

export const Dashboard = () => {
  const [devices, setDevices] = useState<Record<string, DeviceData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    // Subscribe to Firebase real-time updates
    const unsubscribe = subscribeToDevices((data) => {
      setDevices(data);
      setIsConnected(true);
    });

    // Periodic check for online status
    const interval = setInterval(() => {
      setDevices((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          const lastUpdate = new Date(updated[key].last_updated);
          const now = new Date();
          updated[key].is_online = (now.getTime() - lastUpdate.getTime()) < 30000;
        });
        return updated;
      });
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const deviceList = Object.values(devices);
  const onlineCount = deviceList.filter((d) => d.is_online).length;

  return (
    <div className="min-h-screen bg-background bg-grid">
      <DashboardHeader
        totalDevices={deviceList.length}
        onlineDevices={onlineCount}
        isConnected={isConnected}
      />

      <main className="container mx-auto px-4 py-8">
        {deviceList.length === 0 ? (
          <EmptyState onShowSetup={() => setShowSetup(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {deviceList.map((device) => (
              <DeviceCard key={device.device_id} device={device} />
            ))}
          </div>
        )}
      </main>

      {showSetup && <SetupInstructions onClose={() => setShowSetup(false)} />}
    </div>
  );
};
