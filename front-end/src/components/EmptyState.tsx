import { MonitorOff, ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  onShowSetup: () => void;
}

export const EmptyState = ({ onShowSetup }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <Card className="max-w-md w-full border-dashed border-2 border-border/50 bg-card/30">
        <CardContent className="flex flex-col items-center text-center p-8">
          <div className="p-4 rounded-full bg-muted mb-6">
            <MonitorOff className="h-12 w-12 text-muted-foreground" />
          </div>
          
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No Devices Connected
          </h2>
          
          <p className="text-muted-foreground mb-6 max-w-sm">
            Start the Python client on your Windows machine to begin tracking application usage in real-time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button 
              onClick={onShowSetup}
              className="flex-1 gap-2"
            >
              <Download className="h-4 w-4" />
              Setup Instructions
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
