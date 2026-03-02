import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { formatTime } from "@/lib/utils";

export const CHART_COLORS = [
  "#00e5bf", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e", 
  "#22c55e", "#eab308", "#06b6d4", "#ec4899", "#a855f7",
];

// 1. ADD ALIAS LOGIC: Translates 'explorer' -> 'FILE MANAGER'
const processAliases: Record<string, string> = {
  "calc": "Calculator",
  "msedge": "Microsoft Edge",
  "brave": "Brave Browser",
  "explorer": "File Manager",
  "taskmgr": "Task Manager",
  "notepad": "Notepad",
  "whatsapp_root": "WhatsApp",
  "code": "VS Code",
  "chrome": "Google Chrome",
};

const getFriendlyName = (name: string) => {
  const cleanName = name.replace(".exe", "").toLowerCase();
  return processAliases[cleanName] || cleanName;
};

interface ActiveShapeProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
}

const renderActiveShape = (props: ActiveShapeProps) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle} endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx} cy={cy}
        startAngle={startAngle} endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 12}
        fill={fill}
        style={{ opacity: 0.3 }}
      />
    </g>
  );
};

export const AppUsagePie = ({ data, totalTime, selectedApp }: { 
  data: Record<string, number>, 
  totalTime: number,
  selectedApp: string | null 
}) => {
  const chartData = Object.entries(data || {})
    .map(([name, value]) => ({ name, value }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const activeIndex = selectedApp 
    ? chartData.findIndex(item => item.name.toLowerCase() === selectedApp.toLowerCase()) 
    : -1;

  if (chartData.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-gray-600 italic text-xs">
        NO_USAGE_DATA_PROCESSED
      </div>
    );
  }

  return (
    <div className="relative h-[280px] w-full flex items-center justify-center">
      {/* ─── CENTER HUD (UI FIX HERE) ─── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 font-mono">
        <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">
          {selectedApp ? "App Uptime" : "Total Session"}
        </span>
        <span className="text-xl font-black text-white tabular-nums">
          {selectedApp ? formatTime(data[selectedApp] || 0) : formatTime(totalTime)}
        </span>
        
        {/* ✅ THIS WAS MISSING: The glowing app name label */}
        {selectedApp && (
          <span className="text-[10px] text-[#00e5bf] font-bold mt-1 uppercase bg-[#00e5bf]/10 px-2 py-0.5 rounded border border-[#00e5bf]/20 animate-in fade-in zoom-in duration-300">
            {getFriendlyName(selectedApp)}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            activeIndex={activeIndex !== -1 ? activeIndex : undefined}
            activeShape={renderActiveShape}
            data={chartData}
            cx="50%" cy="50%"
            innerRadius={65} 
            outerRadius={85}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={CHART_COLORS[index % CHART_COLORS.length]} 
                style={{
                  opacity: selectedApp && selectedApp.toLowerCase() !== entry.name.toLowerCase() ? 0.3 : 1,
                  transition: 'opacity 0.3s ease'
                }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
