import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from "recharts";
import { formatTime } from "@/lib/utils";

export const CHART_COLORS = ["#00e5bf", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e"];

// Custom shape to handle the "pop-out" effect
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10} // Increased radius for the "pop"
        startAngle={startAngle} endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx} cy={cy}
        startAngle={startAngle} endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 14}
        fill={fill}
        style={{ opacity: 0.3 }}
      />
    </g>
  );
};

export const AppUsagePie = ({ 
  data, 
  totalTime, 
  selectedApp 
}: { 
  data: Record<string, number>, 
  totalTime: number,
  selectedApp: string | null 
}) => {
  const chartData = Object.entries(data || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7)
    .map(([name, value]) => ({ name, value }));

  // Find the index of the selected app to trigger the pop-out
  const activeIndex = selectedApp ? chartData.findIndex(item => item.name === selectedApp) : -1;

  if (chartData.length === 0) return null;

  return (
    <div className="relative h-[280px] w-full flex items-center justify-center">
      {/* Center Text HUD */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">
          {selectedApp ? "App Uptime" : "Total Session"}
        </span>
        <span className="text-xl font-black text-white">
          {selectedApp ? formatTime(data[selectedApp] || 0) : formatTime(totalTime)}
        </span>
        {selectedApp && <span className="text-[10px] text-[#00e5bf] font-bold mt-1 uppercase">{selectedApp}</span>}
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            activeIndex={activeIndex !== -1 ? activeIndex : undefined}
            activeShape={renderActiveShape}
            data={chartData}
            cx="50%" cy="50%"
            innerRadius={75} outerRadius={95}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell 
                key={index} 
                fill={CHART_COLORS[index % CHART_COLORS.length]} 
                stroke="none"
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
