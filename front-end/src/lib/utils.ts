import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility for merging Tailwind CSS classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Global Cyber/Hacker Palette
 * These colors sync between the process list and the Pie Chart segments.
 */
export const CYBER_COLORS =  ["#00e5bf", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#d946ef", // pink
  "#f43f5e", // red
  "#22c55e", // green
  "#eab308", // yellow
  "#06b6d4", // sky
  "#ec4899", // rose
  "#a855f7", // purple
  "#14b8a6",
  "#0ea5e9",
  "#6366f1",
  "#f97316",
  "#84cc16",
    ];

/**
 * Formats seconds into a high-detail duration string
 */
export function formatTime(seconds: number) {
  if (!seconds || seconds <= 0) return "0s";
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Determines the label for the active application based on online status.
 * Required by DeviceCard.tsx for the live tracker display.
 */
export function getActiveAppLabel(isOnline: boolean, currentApp?: string): string {
  if (!isOnline) return "SIGNAL_LOST";
  if (!currentApp || currentApp === "Unknown") return "INITIALIZING...";
  return currentApp;
}