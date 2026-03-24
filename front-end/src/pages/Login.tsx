import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Activity, Lock, Layout } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LAB_IDS = ["0", "1", "2", "3", "4", "5", "6"];
const ADMIN_PASSWORD = "ADMIN123";

const Login = () => {
  const [labId, setLabId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const normalizedInput = labId.trim();
    const isValidLab = LAB_IDS.includes(normalizedInput);

    if (isValidLab && password === ADMIN_PASSWORD) {
      localStorage.setItem("labId", normalizedInput);
      toast.success(`Access Granted: LAB ${normalizedInput} Dashboard Activated`);
      navigate("/");
    } else {
      toast.error("Invalid Lab ID or Password");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#040708] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border/50 rounded-xl p-8 shadow-xl">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Device Usage Tracker
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Admin Authentication
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Layout size={16} className="text-primary" /> Lab ID (0-6)
              </label>
              <Input
                placeholder="e.g. 0"
                value={labId}
                onChange={(e) => setLabId(e.target.value)}
                autoComplete="off"
                className="bg-background border-border/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Lock size={16} className="text-primary" /> Password
              </label>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background border-border/50"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11"
            >
              {isLoading ? "Authenticating..." : "Login"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground">
              Authorized Access Only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
