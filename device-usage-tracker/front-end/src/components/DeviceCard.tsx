import { Monitor, Clock, AppWindow } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusIndicator } from "./StatusIndicator";
import { DeviceData } from "@/lib/firebase";
import { cn } from "@/lib/utils";

interface DeviceCardProps {
  device: DeviceData;
}

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diffSeconds < 10) return "Just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
};

export const DeviceCard = ({ device }: DeviceCardProps) => {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      "border-border/50 bg-card/50 backdrop-blur-sm",
      device.is_online && "border-primary/30 glow-primary"
    )}>
      {/* Gradient overlay for online devices */}
      {device.is_online && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              device.is_online ? "bg-primary/10" : "bg-muted"
            )}>
              <Monitor className={cn(
                "h-5 w-5",
                device.is_online ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <CardTitle className="text-sm font-mono text-foreground/80">
                {device.device_id}
              </CardTitle>
              <StatusIndicator isOnline={device.is_online} size="sm" showLabel />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Active Application */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AppWindow className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Active Application</span>
          </div>
          <div className={cn(
            "p-3 rounded-lg font-mono text-lg font-semibold truncate",
            device.is_online 
              ? "bg-primary/10 text-primary" 
              : "bg-muted text-muted-foreground"
          )}>
            {device.latest_app || "Unknown"}
          </div>
        </div>
        
        {/* Last Updated */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last Updated</span>
          </div>
          <div className="text-right">
            <div className="font-mono text-foreground">
              {formatTimestamp(device.last_updated)}
            </div>
            <div className="text-xs text-muted-foreground">
              {getRelativeTime(device.last_updated)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
