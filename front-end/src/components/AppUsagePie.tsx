/*import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#6366f1", "#8b5cf6", "#f43f5e"];

export const AppUsagePie = ({ data }: { data: Record<string, number> }) => {
  const chartData = Object.entries(data || {}).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, value]) => ({ name, value }));

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '10px', color: '#fff' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};*/
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatTime } from "@/lib/utils";

export const CHART_COLORS = ["#00e5bf", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e"];

// We MUST pass totalTime as a prop here for it to display in the middle!
export const AppUsagePie = ({ data, totalTime }: { data: Record<string, number>, totalTime: number }) => {
  const chartData = Object.entries(data || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  if (chartData.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center border border-dashed border-[#00e5bf]/20 rounded-xl">
        <p className="text-[10px] font-mono text-[#00e5bf] animate-pulse">INIT_DATA_SCAN...</p>
      </div>
    );
  }

  return (
    <div className="relative h-[220px] w-full animate-in zoom-in duration-700 flex items-center justify-center">
      
      {/* 🔴 THIS IS THE NEW OVERLAY THAT PUTS THE TIME IN THE MIDDLE 🔴 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <span className="text-[8px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">Total Time</span>
        <span className="text-sm font-black text-white">{formatTime(totalTime)}</span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={75}
            paddingAngle={5}
            dataKey="value"
            animationBegin={200}
          >
            {chartData.map((_, index) => (
              <Cell 
                key={index} 
                fill={CHART_COLORS[index % CHART_COLORS.length]} 
                stroke="rgba(0,0,0,0.8)" 
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string) => [formatTime(value), name]}
            contentStyle={{ 
              backgroundColor: '#0a0f12', 
              border: '1px solid #00e5bf', 
              borderRadius: '8px',
              boxShadow: '0 4px 15px rgba(0, 229, 191, 0.15)'
            }}
            itemStyle={{
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '12px',
              textTransform: 'uppercase'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};