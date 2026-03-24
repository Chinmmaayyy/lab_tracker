import { Activity, Wifi, WifiOff, LogOut, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  totalDevices: number;
  onlineDevices: number;
  isConnected: boolean;
  labId: string;
  onDownloadLabReport: () => void;
}

export const DashboardHeader = ({ 
  totalDevices, 
  onlineDevices, 
  isConnected,
  labId,
  onDownloadLabReport
}: DashboardHeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("labId");
    navigate("/login");
  };

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
              <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${isConnected ? "bg-success animate-pulse" : "bg-destructive"}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">
                  Device Usage Tracker
                </h1>
                <Badge variant="outline" className="border-primary/30 text-primary font-mono text-[10px]">
                  LAB {labId}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Real-time application monitoring
              </p>
            </div>
          </div>
          
          {/* Stats & Actions */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-2 px-3 py-1.5">
              {isConnected ? (
                <Wifi className="h-3.5 w-3.5 text-success" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-destructive" />
              )}
              <span className="font-mono text-xs uppercase tracking-wider">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </Badge>
            
            <Badge variant="outline" className="gap-2 px-3 py-1.5 border-primary/30">
              <span className="text-muted-foreground">Devices:</span>
              <span className="font-mono text-primary font-bold">{onlineDevices}</span>
              <span className="text-muted-foreground">/</span>
              <span className="font-mono text-foreground">{totalDevices}</span>
            </Badge>

            <div className="flex items-center gap-2 border-l border-border/50 pl-3 ml-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onDownloadLabReport}
                className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                title="Download Lab Report (All Devices)"
              >
                <Download size={14} />
                <span className="hidden md:inline text-xs">Download Lab Report</span>
              </Button>

              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                className="hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                title="Logout"
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};