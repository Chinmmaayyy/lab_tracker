import { useEffect, useState } from "react";
import { DashboardHeader } from "./DashboardHeader";
import { DeviceCard } from "./DeviceCard";
import { EmptyState } from "./EmptyState";
import { SetupInstructions } from "./SetupInstructions";
import { subscribeToDevices, DeviceData, deleteDeviceById } from "@/lib/firebase";
import { toast } from "sonner";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { ShieldAlert } from "lucide-react";

export const Dashboard = () => {
  const [devices, setDevices] = useState<Record<string, DeviceData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  
  // 🔐 ADMIN CONFIGURATION
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const ADMIN_PASSWORD = "ADMIN123";

  useEffect(() => {
    // Real-time Firebase Subscription
    const unsubscribe = subscribeToDevices((data) => {
      setDevices(data || {});
      setIsConnected(true);
    });

    // Connectivity Heartbeat Check (Offline detection)
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

  const confirmDeletion = async () => {
    if (passwordInput !== ADMIN_PASSWORD) {
      toast.error("ACCESS DENIED: Invalid Admin Credentials");
      setPasswordInput("");
      return;
    }

    if (deviceToDelete) {
      try {
        await deleteDeviceById(deviceToDelete);
        toast.success(`NODE ${deviceToDelete} TERMINATED SUCCESSFULLY`);
        setDeviceToDelete(null);
        setPasswordInput("");
      } catch (error) {
        toast.error("SYSTEM ERROR: Firebase deletion failed");
      }
    }
  };

  // Data Processing
  const deviceList = Object.values(devices);
  const activeDevices = deviceList.filter((device) => {
    const lastSeen = new Date(device.last_updated).getTime();
    const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
    return lastSeen > twelveHoursAgo;
  });

  const sortedDevices = [...activeDevices].sort((a, b) => 
    Number(b.is_online) - Number(a.is_online)
  );

  return (
    <div className="min-h-screen bg-[#040708] bg-grid">
      <DashboardHeader
        totalDevices={sortedDevices.length}
        onlineDevices={sortedDevices.filter(d => d.is_online).length}
        isConnected={isConnected}
      />

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {sortedDevices.length === 0 ? (
          <EmptyState onShowSetup={() => setShowSetup(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(450px,1fr))] gap-8 justify-center animate-in fade-in duration-700">
            {sortedDevices.map((device) => (
              <DeviceCard 
                key={device.device_id} 
                device={device} 
                onDelete={(id) => setDeviceToDelete(id)} 
              />
            ))}
          </div>
        )}
      </main>

      {/* ─── CYBER_SECURITY_OVERRIDE_MODAL ─── */}
      <AlertDialog open={!!deviceToDelete} onOpenChange={(open) => {
        if (!open) {
          setDeviceToDelete(null);
          setPasswordInput("");
        }
      }}>
        <AlertDialogContent className="bg-[#0a0f11] border-2 border-red-500/30 text-white font-mono shadow-[0_0_50px_rgba(239,68,68,0.15)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-red-500 text-xl font-black italic uppercase tracking-tighter">
              <ShieldAlert className="animate-pulse" /> AUTHORIZATION_REQUIRED
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-xs leading-relaxed border-l-2 border-red-500/20 pl-4 mt-2">
              CAUTION: You are initiating a permanent purge of Node 
              <span className="text-white font-bold ml-1">[{deviceToDelete}]</span>. 
              This will remove all associated telemetry logs from the surveillance grid.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-6">
            <label className="text-[10px] text-red-500/70 font-black mb-2 block uppercase tracking-[0.2em]">
              Primary_Admin_Key
            </label>
            <Input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmDeletion()}
              className="bg-black/50 border-red-500/20 text-red-500 placeholder:text-red-900 focus-visible:ring-red-500 focus-visible:border-red-500"
              placeholder="CRYPTO_PASS_REQUIRED"
              autoFocus
            />
          </div>

          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="bg-transparent border-white/5 hover:bg-white/5 text-gray-500 hover:text-white transition-all">
              ABORT_PURGE
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault(); 
                confirmDeletion();
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold border-b-4 border-red-900 active:border-b-0 transition-all"
            >
              EXECUTE_TERMINATION
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showSetup && <SetupInstructions onClose={() => setShowSetup(false)} />}
    </div>
  );
};
