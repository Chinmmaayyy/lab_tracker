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
    const unsubscribe = subscribeToDevices((data) => {
      setDevices(data || {});
      setIsConnected(true);
    });

    const interval = setInterval(() => {
      setDevices((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          const lastUpdate = new Date(updated[key].last_updated);
          const now = new Date();
          updated[key].is_online = (now.getTime() - lastUpdate.getTime()) < 15000;
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

  const activeDevices = deviceList.filter((device) => {
    const lastSeen = new Date(device.last_updated).getTime();
    const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
    return lastSeen > twelveHoursAgo;
  });

  const sortedDevices = [...activeDevices].sort((a, b) => 
    Number(b.is_online) - Number(a.is_online)
  );

  const onlineCount = sortedDevices.filter((d) => d.is_online).length;

  /* ... existing imports and state logic ... */

  return (
    <div className="min-h-screen bg-[#040708] bg-grid">
      <DashboardHeader
        totalDevices={sortedDevices.length}
        onlineDevices={onlineCount}
        isConnected={isConnected}
      />

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {sortedDevices.length === 0 ? (
          <EmptyState onShowSetup={() => setShowSetup(true)} />
        ) : (
          /* FLEXIBLE GRID: 
             - grid-cols-1: Single column on mobile.
             - md:grid-cols-2: Two columns on tablets.
             - xl:grid-cols-[repeat(auto-fit,minmax(450px,1fr))]: 
               On large screens, it will automatically fit 2, 3, or 4 
               devices per row depending on available space.
          */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(450px,1fr))] gap-8 justify-center animate-in fade-in duration-700">
            {sortedDevices.map((device) => (
              <DeviceCard key={device.device_id} device={device} />
            ))}
          </div>
        )}
      </main>

      {showSetup && <SetupInstructions onClose={() => setShowSetup(false)} />}
    </div>
  );
};