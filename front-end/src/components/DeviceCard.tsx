import { useState } from "react";
import {
  Monitor,
  Globe,
  Layout,
  Activity,
  ChevronUp,
  ChevronDown,
  Cpu,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppUsagePie } from "./AppUsagePie";
import { DeviceData } from "@/lib/firebase";
import { cn, formatTime, CYBER_COLORS, getActiveAppLabel } from "@/lib/utils";

export const DeviceCard = ({ device }: { device: DeviceData }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedApp, setSelectedApp] = useState<string | null>(
    device.current_app || null
  );

  /* ✅ Browser detection */
  const isBrowser = (app?: string | null) => {
    if (!app) return false;
    return ["msedge", "chrome", "brave", "firefox"].includes(app.toLowerCase());
  };

  /* ✅ Process list */
  const appEntries = Object.entries(device.app_usage || {}).sort(
    ([, a], [, b]) => b - a
  );

  /* ✅ FIXED: Browser-specific web usage (NO MIXUP) */
  const activeWebEntries =
    selectedApp && device.web_usage?.[selectedApp]
      ? Object.entries(device.web_usage[selectedApp])
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
      : [];

  return (
    <Card
      className={cn(
        "relative transition-all duration-500 bg-[#080d10] border-2 rounded-2xl overflow-hidden",
        device.is_online
          ? "border-[#00e5bf]/30 shadow-xl shadow-[#00e5bf]/5"
          : "border-gray-900 opacity-70"
      )}
    >
      <CardContent className="p-0 text-white font-mono">
        {/* ───────── HEADER ───────── */}
        <div className="p-6 border-b border-white/5 bg-gradient-to-b from-[#00e5bf]/5 to-transparent">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "p-3 rounded-xl border-2",
                  device.is_online
                    ? "border-[#00e5bf] text-[#00e5bf]"
                    : "border-gray-800 text-gray-800"
                )}
              >
                <Monitor className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-widest uppercase">
                  {device.device_id}
                </h3>
                <span className="text-[10px] text-[#00e5bf] font-bold">
                  {device.is_online
                    ? "TRACKING_LIVE"
                    : "CONNECTION_INTERRUPTED"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[9px] text-gray-500 uppercase font-bold">
                  Total_Uptime
                </p>
                <p className="text-xl font-black">
                  {formatTime(device.total_screen_time)}
                </p>
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
              >
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
              </button>
            </div>
          </div>

          {/* CURRENT PROCESS */}
          <div className="border border-[#00e5bf]/20 bg-black/60 p-4 rounded-xl flex gap-4">
            <Layout className="text-[#00e5bf]" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-[#00e5bf] uppercase font-black">
                Current_Process
              </p>
              <h2 className="text-lg font-black truncate">
                {getActiveAppLabel(device.is_online, device.current_app)}
              </h2>
              <p className="text-xs text-gray-400 truncate">
                &gt; {device.website || "exec_system_idle"}
              </p>
            </div>
          </div>
        </div>

        {/* ───────── EXPANDED ANALYTICS ───────── */}
        {isExpanded && (
          <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr]">
            {/* PROCESS STACK */}
            <div className="p-5 border-r border-white/5 bg-black/40">
              <div className="flex items-center gap-2 mb-5">
                <Cpu size={14} className="text-[#bc00ff]" />
                <span className="text-[10px] font-black uppercase text-gray-400">
                  Process_Stack
                </span>
              </div>

              <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-2">
                {appEntries.map(([name, time], index) => {
                  const isSelected = selectedApp === name;
                  const color =
                    CYBER_COLORS[index % CYBER_COLORS.length];

                  return (
                    <button
                      key={name}
                      onClick={() => setSelectedApp(name)}
                      className={cn(
                        "w-full flex justify-between px-3 py-2.5 rounded border transition-all",
                        isSelected
                          ? "border-[#00e5bf] bg-white/5"
                          : "border-transparent hover:border-white/10"
                      )}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span
                          className="text-[11px] font-bold truncate lowercase"
                          style={{ color: isSelected ? color : "#666" }}
                        >
                          {name}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-70">
                        {formatTime(time)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="p-6 bg-[#00e5bf]/[0.01]">
              {isBrowser(selectedApp) && activeWebEntries.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <Globe size={14} className="text-[#00e5bf]" />
                    <span className="text-[10px] uppercase font-black text-cyan-400">
                      Network_Traffic_Logs // {selectedApp}
                    </span>
                  </div>

                  <div
                    className="space-y-4 max-h-[360px] overflow-y-auto pr-2"
                  >
                    {activeWebEntries.map(([site, time]) => (
                      <div
                        key={site}
                        className="border-b border-white/5 pb-2"
                      >
                        <div className="flex justify-between gap-4">
                          <span className="text-xs text-gray-300 truncate">
                            {site}
                          </span>
                          <span className="text-[10px] text-[#00e5bf]">
                            {formatTime(time)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={14} className="text-[#bc00ff]" />
                    <span className="text-[10px] uppercase font-black text-gray-500">
                      Data_Distribution_Model
                    </span>
                  </div>

                  <AppUsagePie
                    data={device.app_usage}
                    totalTime={device.total_screen_time}
                    selectedApp={selectedApp}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* ───────── FOOTER ───────── */}
        <div className="px-6 py-4 border-t border-white/5 bg-black/60 flex justify-between">
          <span className="text-[9px] text-gray-600 uppercase font-black">
            Parental_Watch_Active
          </span>
          <span className="text-[9px] text-gray-600">
            {new Date(device.last_updated).toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
