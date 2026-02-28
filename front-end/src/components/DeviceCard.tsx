import { useState } from "react";
import { Monitor, Globe, Layout, Activity, Clock, ExternalLink, ChevronUp, ChevronDown, Cpu, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppUsagePie } from "./AppUsagePie";
import { DeviceData } from "@/lib/firebase";
import { cn, formatTime, CYBER_COLORS, getActiveAppLabel } from "@/lib/utils";

export const DeviceCard = ({ device }: { device: DeviceData }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedApp, setSelectedApp] = useState<string | null>(device.current_app || null);

  // Helper to identify if the selected app should show Web History or Pie Chart
  const isBrowser = (app?: string) => {
    const browsers = ['msedge', 'chrome', 'brave', 'firefox'];
    return browsers.includes(app?.toLowerCase() || "");
  };

  const appEntries = Object.entries(device.app_usage || {}).sort(([, a], [, b]) => b - a);

  return (
    <Card className={cn(
      "relative transition-all duration-500 bg-[#080d10] border-2 rounded-2xl overflow-hidden",
      device.is_online ? "border-[#00e5bf]/30 shadow-xl shadow-[#00e5bf]/5" : "border-gray-900 opacity-70"
    )}>
      <CardContent className="p-0 text-white font-mono">

        {/* --- LIVE HUD HEADER --- */}
        <div className="p-6 pb-6 border-b border-white/5 bg-gradient-to-b from-[#00e5bf]/5 to-transparent">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-xl border-2 transition-all", 
                device.is_online ? "border-[#00e5bf] text-[#00e5bf] shadow-[0_0_10px_#00e5bf]" : "border-gray-800 text-gray-800"
              )}>
                <Monitor className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-widest text-gray-100 uppercase">
                  {device.device_id}
                </h3>
                <span className="text-[10px] flex items-center gap-2 mt-1 font-bold text-[#00e5bf]">
                  {device.is_online ? <><span className="h-2 w-2 bg-[#00e5bf] animate-pulse rounded-full"/> TRACKING_LIVE</> : '● CONNECTION_INTERRUPTED'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="text-right">
                <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Total_Uptime</p>
                <p className="text-xl font-black text-white">{formatTime(device.total_screen_time)}</p>
              </div>
              <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="mt-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#00e5bf] transition-all border border-white/10"
              >
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
          </div>

          {/* ACTIVE STATUS BOX */}
          <div className="border border-[#00e5bf]/20 bg-black/60 p-4 rounded-xl flex items-center gap-5 relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00e5bf]/10 animate-pulse" />
             <div className="p-3 bg-[#00e5bf]/10 rounded-lg border border-[#00e5bf]/20">
               <Layout className="h-6 w-6 text-[#00e5bf]" />
             </div>
             <div className="min-w-0 flex-1">
               <p className="text-[9px] text-[#00e5bf] uppercase tracking-[0.3em] mb-1 font-black">Current_Process</p>
               <h2 className="text-lg font-black text-white truncate leading-none">
                 {getActiveAppLabel(device.is_online, device.current_app)}
               </h2>
               <p className="text-xs text-gray-400 truncate mt-2 font-mono italic opacity-80">
                 &gt; {device.website || "exec_system_idle"}
               </p>
             </div>
          </div>
        </div>

        {/* --- EXPANDED ANALYTICS MODULE --- */}
        {isExpanded && (
          <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] animate-in slide-in-from-top-4 duration-500">

            {/* LEFT: PROCESS STACK */}
            <div className="p-5 border-r border-white/5 bg-black/40">
              <div className="flex items-center gap-2 mb-5">
                <Cpu size={14} className="text-[#bc00ff]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Process_Stack</span>
              </div>
              <div className="space-y-1.5">
                {appEntries.slice(0, 7).map(([name, time], index) => {
                  const isSelected = selectedApp === name;
                  const itemColor = CYBER_COLORS[index % CYBER_COLORS.length];

                  return (
                    <button
                      key={name}
                      onClick={() => setSelectedApp(name)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded border transition-all",
                        isSelected 
                          ? "bg-white/5 border-[#00e5bf] shadow-[0_0_15px_rgba(0,229,191,0.05)]" 
                          : "bg-transparent border-transparent hover:border-white/10"
                      )}
                      style={{ color: isSelected ? itemColor : '#666' }}
                    >
                      <div className="flex items-center gap-3 truncate pr-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: itemColor }} />
                        <span className="text-[11px] font-bold truncate lowercase tracking-tight">_root/{name}</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-80">{formatTime(time)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: CONTEXTUAL VIEW (PIE OR WEB) */}
            <div className="p-6 bg-[#00e5bf]/[0.01]">
              {isBrowser(selectedApp) ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe size={14} className="text-[#00e5bf]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                      Network_Traffic_Logs // {selectedApp}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(device.web_usage || {})
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 6)
                      .map(([site, time]) => (
                      <div key={site} className="group relative border-b border-white/5 pb-2">
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <span className="text-xs font-bold text-gray-300 leading-tight hover:text-[#00e5bf] transition-colors">{site}</span>
                          <span className="text-[10px] text-[#00e5bf] font-mono shrink-0">{formatTime(time)}</span>
                        </div>
                        <div className="w-full bg-white/5 h-[1px] overflow-hidden">
                           <div 
                             className="bg-[#00e5bf] h-full shadow-[0_0_8px_#00e5bf]" 
                             style={{ width: `${Math.min(100, (time / (device.total_screen_time || 1)) * 100)}%` }} 
                           />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full items-center justify-center">
                  <div className="w-full flex items-center gap-2 mb-2">
                    <Activity size={14} className="text-[#bc00ff]" />
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                      Data_Distribution_Model
                    </span>
                  </div>
                  
                  {/* DYNAMIC PIE CHART */}
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

        {/* --- FOOTER MOD --- */}
        <div className="px-6 py-4 border-t border-white/5 flex justify-between items-center bg-black/60">
           <div className="flex items-center gap-3">
             <ShieldAlert size={14} className="text-primary/40" />
             <span className="text-[9px] text-gray-600 uppercase font-black tracking-widest">
               Parental_Watch_Active // Secured_Node
             </span>
           </div>
           <span className="text-[9px] text-gray-700 font-mono italic">
             LAST_REP: {new Date(device.last_updated).toLocaleString()}
           </span>
        </div>
      </CardContent>
    </Card>
  );
};