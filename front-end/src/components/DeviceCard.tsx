import { useState } from "react";
import {
  Monitor,
  Globe,
  Layout,
  Activity,
  ChevronUp,
  ChevronDown,
  Cpu,
  Trash2, // ✅ ADDED
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppUsagePie } from "./AppUsagePie";
import { DeviceData } from "@/lib/firebase";
import { cn, formatTime, CYBER_COLORS, getActiveAppLabel } from "@/lib/utils";

/* ─────────────────────────────────────────────
   PROCESS NAME ALIASES (EASY TO UNDERSTAND)
───────────────────────────────────────────── */
const processAliases: Record<string, string> = {
  "calc": "Calculator",
  "msedge": "Microsoft Edge",
  "brave": "Brave Browser",
  "explorer": "File Manager",
  "taskmgr": "Task Manager",
  "notepad": "Notepad",
  "snippingtool": "Snipping Tool",
  "pickerhost": "File Picker (System)",
  "openwith": "App Selector (System)",
  "whatsapp_root": "WhatsApp",
  "code": "VS Code",
  "powerpnt_exe": "PowerPoint",
  "shellhost": "Windows Shell",
  "applicationframehost": "Windows App Frame",
  "chrome": "Google Chrome",
  "cmd": "Command Prompt"
};

const getFriendlyName = (name: string) => {
  const cleanName = name.replace(".exe", "").toLowerCase();
  return processAliases[cleanName] || cleanName;
};

/* ─────────────────────────────────────────────
   CLEAN SITE NAME (UI ONLY – NO DATA LOSS)
───────────────────────────────────────────── */
const cleanSiteName = (site: string) => {
  return site
    .replace(/ and \d+ more pages.*$/i, "")
    .replace(/\s*-\s*Personal$/i, "")
    .trim();
};

export const DeviceCard = ({
  device,
  onDelete,
}: {
  device: DeviceData;
  onDelete: (id: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedApp, setSelectedApp] = useState<string | null>(
    device.current_app || null
  );

  /* ───────── Browser Detection ───────── */
  const isBrowser = (app?: string | null) => {
    if (!app) return false;
    return ["msedge", "chrome", "brave", "firefox"].includes(app.toLowerCase());
  };

  /* ───────── Process Stack ───────── */
  const appEntries = Object.entries(device.app_usage || {}).sort(
    ([, a], [, b]) => b - a
  );

  /* ───────── Browser-specific Web Usage ───────── */
  const activeWebEntries =
    selectedApp && device.web_usage?.[selectedApp]
      ? Object.entries(device.web_usage[selectedApp])
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
      : [];

  /* ───────── Total web time for selected browser ───────── */
  const totalWebTime = activeWebEntries.reduce(
    (acc, [, time]) => acc + time,
    0
  );

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
                onClick={() => onDelete(device.device_id)}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-500 transition-all"
                title="Delete Device"
                >
                <Trash2 size={16} />
              </button>
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
              <h2 className="text-lg font-black truncate leading-none">
                {getFriendlyName(getActiveAppLabel(device.is_online, device.current_app))}
              </h2>
              <p className="text-xs text-gray-400 truncate mt-1">
                &gt; {device.website || "exec_system_idle"}
              </p>
            </div>
          </div>
        </div>

        {/* ───────── EXPANDED ANALYTICS ───────── */}
        {isExpanded && (
          <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr]">
            {/* LEFT: PROCESS STACK - FULL COLOR VERSION WITH ALIASES */}
            <div className="p-5 border-r border-white/5 bg-black/40">
              <div className="flex items-center gap-2 mb-5">
                <Cpu size={14} className="text-[#bc00ff]" />
                <span className="text-[10px] font-black uppercase text-gray-400">
                  Process_Stack
                </span>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {appEntries.map(([name, time], index) => {
                  const isSelected = selectedApp === name;
                  const color = CYBER_COLORS[index % CYBER_COLORS.length];

                  return (
                    <button
                      key={name}
                      onClick={() => setSelectedApp(name)}
                      className={cn(
                        "w-full flex justify-between px-3 py-2.5 rounded-lg border transition-all duration-300",
                        isSelected
                          ? "border-transparent text-[#080d10]" // Selected: solid bg, dark text
                          : "border-white/5 text-[#666] hover:border-white/20"
                      )}
                      style={isSelected ? { backgroundColor: color, boxShadow: `0 0 15px ${color}40` } : {}}
                    >
                      <span className="text-[11px] font-black truncate uppercase">
                        {getFriendlyName(name)}
                      </span>
                      <span className="text-[10px] font-bold opacity-80 shrink-0">
                        {formatTime(time)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: WEB HISTORY - FIXED GRID & PROGRESS BARS */}
            <div className="p-6 bg-[#00e5bf]/[0.01]">
              {isBrowser(selectedApp) && activeWebEntries.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-[#00e5bf]" />
                      <span className="text-[10px] uppercase font-black text-cyan-400">
                        Network_Traffic_Logs // {getFriendlyName(selectedApp || "")}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#00e5bf] font-mono tracking-widest">
                      TOTAL_WEB_TIME: {formatTime(totalWebTime)}
                    </span>
                  </div>

                  <div className="space-y-6 max-h-[380px] overflow-y-auto pr-3 custom-scrollbar">
                    {activeWebEntries.map(([site, time]) => {
                      const percentage = Math.min(100, (time / (totalWebTime || 1)) * 100);

                      return (
                        <div key={site} className="group relative border-b border-white/5 pb-4">
                          {/* GRID LAYOUT: Fixes the barrier issue by isolating name and time */}
                          <div className="grid grid-cols-[1fr_auto] items-center gap-4 mb-2">
                            <div className="min-w-0">
                              <span
                                className="text-[11px] font-bold text-gray-300 truncate block group-hover:text-[#00e5bf] transition-colors"
                                title={site}
                              >
                                {cleanSiteName(site)}
                              </span>
                            </div>
                            <div className="shrink-0">
                              <span className="text-[10px] text-[#00e5bf] font-mono font-black bg-black/60 px-2 py-1 rounded border border-[#00e5bf]/20 shadow-[0_0_8px_rgba(0,229,191,0.1)]">
                                {formatTime(time)}
                              </span>
                            </div>
                          </div>

                          {/* GLOWING PROGRESS BAR */}
                          <div className="relative w-full h-[3px] bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="absolute top-0 left-0 h-full bg-[#00e5bf] transition-all duration-1000 ease-out"
                              style={{ 
                                width: `${percentage}%`,
                                boxShadow: '0 0 10px #00e5bf'
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col h-full items-center justify-center">
                  <div className="w-full flex items-center gap-2 mb-4">
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
                </div>
              )}
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t border-white/5 bg-black/60 flex justify-between">
          <span className="text-[9px] text-gray-600 uppercase font-black">
            Parental_Watch_Active
          </span>
          <span className="text-[9px] text-gray-700 font-mono">
            {new Date(device.last_updated).toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
