import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const sizeClasses = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

export const StatusIndicator = ({ 
  isOnline, 
  size = "md", 
  showLabel = false 
}: StatusIndicatorProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={cn(
            "rounded-full",
            sizeClasses[size],
            isOnline ? "bg-success" : "bg-muted-foreground"
          )}
        />
        {isOnline && (
          <div
            className={cn(
              "absolute inset-0 rounded-full bg-success animate-ping opacity-75",
              sizeClasses[size]
            )}
          />
        )}
      </div>
      {showLabel && (
        <span className={cn(
          "text-sm font-medium",
          isOnline ? "text-success" : "text-muted-foreground"
        )}>
          {isOnline ? "Online" : "Offline"}
        </span>
      )}
    </div>
  );
};
