import { useState } from "react";
import { Monitor, Globe, Layout, Activity, Clock, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppUsagePie, CHART_COLORS } from "./AppUsagePie";
import { DeviceData } from "@/lib/firebase";
import { cn, formatTime } from "@/lib/utils";

export const DeviceCard = ({ device }: { device: DeviceData }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedApp, setSelectedApp] = useState<string | null>(device.current_app || null);

  const isBrowser = (app?: string) => {
    const browsers = ['msedge', 'chrome', 'brave', 'firefox'];
    return browsers.includes(app?.toLowerCase() || "");
  };

  const appEntries = Object.entries(device.app_usage || {}).sort(([, a], [, b]) => b - a);

  return (
    <Card className={cn(
      "relative transition-all duration-500 bg-[#080d10] border rounded-2xl overflow-hidden",
      device.is_online ? "border-[#00e5bf]/20 shadow-lg shadow-[#00e5bf]/5" : "border-gray-800 opacity-70"
    )}>
      <CardContent className="p-0 text-white font-sans">
        
        {/* HEADER SECTION */}
        <div className="p-6 pb-6 border-b border-white/5 bg-gradient-to-b from-[#00e5bf]/5 to-transparent">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-xl transition-all", 
                device.is_online ? "bg-[#00e5bf]/10 text-[#00e5bf]" : "bg-gray-800 text-gray-500"
              )}>
                <Monitor className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide text-gray-100 uppercase">
                  {device.device_id}
                </h3>
                <span className="text-[10px] flex items-center gap-1.5 mt-1 font-semibold text-[#00e5bf]/80 uppercase">
                  {device.is_online ? <><span className="h-1.5 w-1.5 bg-[#00e5bf] animate-pulse rounded-full"/> RECORDING LIVE</> : 'OFFLINE'}
                </span>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="text-right">
                <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Total Usage</p>
                <p className="text-xl font-black text-white">{formatTime(device.total_screen_time)}</p>
              </div>
              <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="mt-1 flex items-center justify-center p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          {/* CURRENT ACTIVITY PILL */}
          <div className="border border-white/5 bg-black/40 p-4 rounded-xl flex items-center gap-4">
             <div className="p-2.5 bg-[#00e5bf]/10 rounded-lg">
               <Layout className="h-5 w-5 text-[#00e5bf]" />
             </div>
             <div className="min-w-0 flex-1">
               <p className="text-[9px] text-[#00e5bf] uppercase tracking-widest mb-1 font-bold">Current Activity</p>
               <h2 className="text-lg font-bold text-white truncate leading-none">{device.current_app || "SYSTEM IDLE"}</h2>
               <p className="text-xs text-gray-400 truncate mt-1.5 flex items-center gap-1.5">
                 <ExternalLink size={12} className="text-gray-500"/> {device.website || "Monitoring local system..."}
               </p>
             </div>
          </div>
        </div>

        {/* EXPANDABLE BOTTOM SECTION */}
        {isExpanded && (
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr]">
            
            {/* Left Column: Process History */}
            <div className="p-5 border-r border-white/5 bg-black/20">
              <div className="flex items-center gap-2 mb-5">
                <Activity size={14} className="text-[#00e5bf]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Process History</span>
              </div>
              <div className="space-y-2">
                {appEntries.slice(0, 6).map(([name, time], index) => {
                  const isSelected = selectedApp === name;
                  const itemColor = index < CHART_COLORS.length ? CHART_COLORS[index] : "#4b5563"; 

                  return (
                    <button
                      key={name}
                      onClick={() => setSelectedApp(name)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all border",
                        isSelected 
                          ? "text-[#04090b] font-black" 
                          : "text-gray-300 hover:bg-white/5 border-transparent font-bold"
                      )}
                      style={isSelected ? { 
                        backgroundColor: itemColor, 
                        borderColor: itemColor,
                        boxShadow: `0 0 15px ${itemColor}40` 
                      } : {}}
                    >
                      <div className="flex items-center gap-2 truncate pr-3">
                        <div 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: isSelected ? '#04090b' : itemColor }} 
                        />
                        <span className="text-xs truncate">{name}</span>
                      </div>
                      <span className={cn("text-xs font-mono font-normal", isSelected ? "opacity-90" : "opacity-60")}>
                        {formatTime(time)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Browse History / Contextual View */}
            <div className="p-6">
              {isBrowser(selectedApp) ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-6">
                    <Globe size={14} className="text-[#00e5bf]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                      {selectedApp?.toUpperCase()} BROWSE HISTORY
                    </span>
                  </div>
                  <div className="space-y-5">
                    {Object.entries(device.web_usage || {})
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 6)
                      .map(([site, time]) => (
                      <div key={site} className="relative">
                        <div className="flex justify-between items-baseline mb-2">
                          <span className="text-xs font-semibold text-gray-200 truncate pr-4">{site}</span>
                          <span className="text-[10px] text-[#00e5bf] font-mono font-bold">{formatTime(time)}</span>
                        </div>
                        <div className="w-full bg-white/5 h-[3px] rounded-full overflow-hidden">
                           <div 
                             className="bg-[#00e5bf] h-full rounded-full transition-all duration-1000" 
                             style={{ width: `${Math.min(100, (time / (device.total_screen_time || 1)) * 100)}%` }} 
                           />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full w-full">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={14} className="text-[#00e5bf]" />
                    <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">
                      APP DATA DISTRIBUTION
                    </span>
                  </div>
                  <div className="w-full h-full flex items-center justify-center py-4">
                    {/* 🔴 HERE WE PASS THE TOTAL TIME DOWN TO THE CHART 🔴 */}
                    <AppUsagePie data={device.app_usage} totalTime={device.total_screen_time} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="px-5 py-3 border-t border-white/5 flex items-center gap-2 text-gray-500 bg-black/40">
           <Clock size={12} />
           <span className="text-[9px] uppercase font-bold tracking-wider">
             Last Reported: {new Date(device.last_updated).toLocaleString()}
           </span>
        </div>
      </CardContent>
    </Card>
  );
};