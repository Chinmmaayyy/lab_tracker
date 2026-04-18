import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "./DashboardHeader";
import { DeviceCard } from "./DeviceCard";
import { EmptyState } from "./EmptyState";
import { SetupInstructions } from "./SetupInstructions";
import {
  subscribeToLabDevices,
  clearAllAlertsByDeviceIds,
  DeviceData,
  deleteDeviceById,
} from "@/lib/firebase";
import { exportDeviceToExcel, exportLabToExcel } from "@/lib/exportUtils"; // ⬅️ UPDATED
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Download, Trash2 } from "lucide-react";

export const Dashboard = () => {
  const navigate = useNavigate();
  const labId = localStorage.getItem("labId");
  
  const [devices, setDevices] = useState<Record<string, DeviceData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);
  const [isClearingAlerts, setIsClearingAlerts] = useState(false);
  const seenAlertsRef = useRef(new Set<string>());
  
  // 🔐 ADMIN & DELETION STATE
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const ADMIN_PASSWORD = "QWERTY123456";

  useEffect(() => {
    if (!labId) {
      navigate("/login");
      return;
    }

    const unsubscribe = subscribeToLabDevices(labId, (data) => {
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
  }, [labId, navigate]);

  useEffect(() => {
    Object.entries(devices).forEach(([deviceId, device]) => {
      if (!device.alerts) {
        return;
      }

      Object.values(device.alerts).forEach((alert) => {
        if (alert?.type !== "suspicious_activity" || !alert.timestamp) {
          return;
        }

        const alertKey = `${deviceId}-${alert.timestamp}`;
        if (seenAlertsRef.current.has(alertKey)) {
          return;
        }

        seenAlertsRef.current.add(alertKey);

        // Keep dedupe storage bounded to avoid long-session memory growth.
        if (seenAlertsRef.current.size > 2000) {
          const oldest = seenAlertsRef.current.values().next().value;
          if (oldest) {
            seenAlertsRef.current.delete(oldest);
          }
        }

        toast.error(`🚨 ${deviceId} opened ${alert.website || alert.app || "suspicious activity"}`, {
          duration: 10000,
          closeButton: true,
          className: "min-w-[360px] py-4 text-base",
        });
      });
    });
  }, [devices]);

  // 🛠️ ENHANCED DELETION LOGIC
  const executeFinalPurge = async (shouldDownload: boolean) => {
    if (passwordInput !== ADMIN_PASSWORD) {
      toast.error("ACCESS DENIED: Invalid Admin Credentials");
      return;
    }

    if (deviceToDelete) {
      try {
        // 1. Optional Download Step
        if (shouldDownload) {
          const targetDevice = devices[deviceToDelete];
          if (targetDevice) {
            exportDeviceToExcel(targetDevice);
            toast.info("DATA BACKUP INITIATED...");
          }
        }

        // 2. Permanent Deletion
        if (labId) {
          await deleteDeviceById(labId, deviceToDelete);
          toast.success(`NODE ${deviceToDelete} TERMINATED SUCCESSFULLY`);
        }
        
        // 3. Reset State
        setDeviceToDelete(null);
        setPasswordInput("");
      } catch (error) {
        toast.error("SYSTEM ERROR: Firebase deletion failed");
      }
    }
  };

  const deviceList = Object.values(devices);
  const activeDevices = deviceList.filter((device) => {
    const lastSeen = new Date(device.last_updated).getTime();
    const twelveHoursAgo = Date.now() - (12 * 60 * 60 * 1000);
    return lastSeen > twelveHoursAgo;
  });

  const sortedDevices = [...activeDevices].sort((a, b) => 
    Number(b.is_online) - Number(a.is_online)
  );

  const suspiciousAlerts = Object.entries(devices)
    .flatMap(([deviceId, device]) => {
      return Object.values(device.alerts || {})
        .filter((alert) => alert?.type === "suspicious_activity" && alert.timestamp)
        .map((alert) => ({
          deviceId,
          app: alert.app || "unknown_app",
          website: alert.website || "",
          timestamp: alert.timestamp,
        }));
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const suspiciousAlertCount = suspiciousAlerts.length;

  const handleClearAllAlerts = async () => {
    if (!labId || suspiciousAlerts.length === 0 || isClearingAlerts) {
      return;
    }

    const shouldClear = window.confirm(
      "Clear all suspicious alerts from Firebase for this lab?"
    );

    if (!shouldClear) {
      return;
    }

    try {
      setIsClearingAlerts(true);
      const uniqueDeviceIds = [...new Set(suspiciousAlerts.map((alert) => alert.deviceId))];
      await clearAllAlertsByDeviceIds(labId, uniqueDeviceIds);
      toast.success("All alerts cleared successfully.");
    } catch (error) {
      toast.error("Failed to clear alerts.");
    } finally {
      setIsClearingAlerts(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040708] bg-grid">
      <DashboardHeader
        totalDevices={sortedDevices.length}
        onlineDevices={sortedDevices.filter(d => d.is_online).length}
        isConnected={isConnected}
        labId={labId || "UNKNOWN"}
        suspiciousAlertCount={suspiciousAlertCount}
        onOpenAlerts={() => setShowAlertsPanel(true)}
        onDownloadLabReport={() => exportLabToExcel(devices, labId || "0")}
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
              Would you like to archive telemetry logs to Excel before termination?
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
              className="bg-black/50 border-red-500/20 text-red-500 placeholder:text-red-900 focus-visible:ring-red-500"
              placeholder="CRYPTO_PASS_REQUIRED"
              autoFocus
            />
          </div>

          <AlertDialogFooter className="flex-col sm:flex-row gap-3">
            <AlertDialogCancel className="bg-transparent border-white/5 hover:bg-white/5 text-gray-500 hover:text-white">
              ABORT
            </AlertDialogCancel>
            
            <div className="flex gap-2 w-full sm:w-auto">
              {/* Option 1: Direct Delete */}
              <button
                onClick={() => executeFinalPurge(false)}
                className="flex-1 sm:flex-none px-4 py-2 text-[10px] border border-red-500/50 text-red-500 hover:bg-red-500/10 rounded font-bold transition-all"
              >
                DIRECT_PURGE
              </button>

              {/* Option 2: Download then Delete */}
              <AlertDialogAction 
                onClick={(e) => {
                  e.preventDefault(); 
                  executeFinalPurge(true);
                }}
                className="flex-1 sm:flex-none bg-[#00e5bf] hover:bg-[#00cca8] text-black font-black flex gap-2 items-center justify-center"
              >
                <Download size={14} /> SAVE_&_PURGE
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showAlertsPanel} onOpenChange={setShowAlertsPanel}>
        <DialogContent className="bg-[#0a0f11] border-2 border-red-500/30 text-white font-mono max-w-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-red-400 uppercase tracking-wider flex items-center gap-2">
                🚨 Suspicious Activity Alerts
              </DialogTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAllAlerts}
                disabled={suspiciousAlerts.length === 0 || isClearingAlerts}
                className="border-red-500/50 text-red-300 hover:bg-red-500/10"
              >
                {isClearingAlerts ? "Clearing..." : "Clear All"}
              </Button>
            </div>
            <DialogDescription className="text-gray-400">
              Recent suspicious activity events detected across tracked devices.
            </DialogDescription>
          </DialogHeader>

          {suspiciousAlerts.length === 0 ? (
            <div className="text-sm text-gray-400 py-6">No suspicious alerts yet.</div>
          ) : (
            <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-2">
              {suspiciousAlerts.map((alert, index) => (
                <div
                  key={`${alert.deviceId}-${alert.timestamp}-${index}`}
                  className="border border-red-500/20 rounded-lg p-3 bg-black/30"
                >
                  <div className="text-sm text-red-300 font-bold">
                    {alert.deviceId} opened {alert.website || alert.app}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showSetup && <SetupInstructions onClose={() => setShowSetup(false)} />}
    </div>
  );
};