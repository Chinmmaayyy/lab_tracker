import { Activity, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  totalDevices: number;
  onlineDevices: number;
  isConnected: boolean;
}

export const DashboardHeader = ({ 
  totalDevices, 
  onlineDevices, 
  isConnected 
}: DashboardHeaderProps) => {
  return (
    <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-success animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Device Usage Tracker
              </h1>
              <p className="text-sm text-muted-foreground">
                Real-time application monitoring
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-2 px-3 py-1.5">
              {isConnected ? (
                <Wifi className="h-3.5 w-3.5 text-success" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-destructive" />
              )}
              <span className="font-mono">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </Badge>
            
            <Badge variant="outline" className="gap-2 px-3 py-1.5 border-primary/30">
              <span className="text-muted-foreground">Devices:</span>
              <span className="font-mono text-primary">{onlineDevices}</span>
              <span className="text-muted-foreground">/</span>
              <span className="font-mono text-foreground">{totalDevices}</span>
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
};