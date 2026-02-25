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

  return (
    <div className="min-h-screen bg-[#040708] bg-grid">
      <DashboardHeader
        totalDevices={sortedDevices.length}
        onlineDevices={onlineCount}
        isConnected={isConnected}
      />

      {/* CHANGE: max-w-[1600px] ensures the dashboard doesn't get too thin 
          on wide screens. 
      */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {sortedDevices.length === 0 ? (
          <EmptyState onShowSetup={() => setShowSetup(true)} />
        ) : (
          /* CHANGE: Adjusted grid to 'md:grid-cols-2' for side-by-side view.
             Added 'xl:grid-cols-3' for very large screens.
             Increased gap to '8' for better breathing room.
          */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in duration-700">
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
