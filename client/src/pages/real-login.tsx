import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, User, Eye, EyeOff, Loader2, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TypingMetrics {
  avgKeyDownTime: number;
  avgKeyUpTime: number;
  typingSpeed: number;
  keystrokeCount: number;
  totalTypingTime: number;
}

type SimulationState = "form" | "processing" | "success" | "failure";

export default function RealLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [simulationState, setSimulationState] = useState<SimulationState>("form");
  
  const keyTimesRef = useRef<number[]>([]);
  const keyIntervalsRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  const handleKeyDown = () => {
    const now = Date.now();
    keyTimesRef.current.push(now);
    
    if (lastKeyTimeRef.current > 0) {
      keyIntervalsRef.current.push(now - lastKeyTimeRef.current);
    }
    lastKeyTimeRef.current = now;
  };

  const getTypingMetrics = (): TypingMetrics => {
    const times = keyTimesRef.current;
    const intervals = keyIntervalsRef.current;
    const totalTime = (Date.now() - startTimeRef.current) / 1000;
    const charCount = username.length + password.length;
    
    if (intervals.length < 2) {
      return { 
        avgKeyDownTime: 100, 
        avgKeyUpTime: 50, 
        typingSpeed: 45,
        keystrokeCount: charCount,
        totalTypingTime: totalTime
      };
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const typingSpeed = Math.round((charCount / totalTime) * 60 / 5);
    
    return {
      avgKeyDownTime: Math.round(avgInterval * 0.6),
      avgKeyUpTime: Math.round(avgInterval * 0.4),
      typingSpeed: Math.min(200, Math.max(10, typingSpeed)),
      keystrokeCount: times.length,
      totalTypingTime: Math.round(totalTime * 1000),
    };
  };

  const getDeviceFingerprint = () => ({
    userAgent: navigator.userAgent,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    colorDepth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    languages: navigator.languages?.join(',') || navigator.language,
    platform: navigator.platform,
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory || 0,
    touchSupport: 'ontouchstart' in window,
    webglVendor: getWebGLInfo().vendor,
    webglRenderer: getWebGLInfo().renderer,
  });

  const simulateMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; typingMetrics: TypingMetrics; fingerprint: any }) => {
      const response = await apiRequest("POST", "/api/simulate-login", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setSimulationState("success");
      } else {
        setSimulationState("failure");
      }
    },
    onError: () => {
      setSimulationState("failure");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSimulationState("processing");
    
    simulateMutation.mutate({
      username,
      password,
      typingMetrics: getTypingMetrics(),
      fingerprint: getDeviceFingerprint(),
    });
  };

  const handleReset = () => {
    setUsername("");
    setPassword("");
    setSimulationState("form");
    keyTimesRef.current = [];
    keyIntervalsRef.current = [];
    startTimeRef.current = Date.now();
    lastKeyTimeRef.current = 0;
  };

  // Success Screen
  if (simulationState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="mx-auto w-20 h-20 bg-chart-2/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-chart-2" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-chart-2">Login Successful</h2>
              <p className="text-muted-foreground text-sm">
                Your login attempt was verified successfully.
              </p>
            </div>
            <Button onClick={handleReset} variant="outline" className="w-full" data-testid="button-try-again">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Another Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Failure Screen
  if (simulationState === "failure") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="mx-auto w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-destructive">Login Failed</h2>
              <p className="text-muted-foreground text-sm">
                Your login attempt could not be verified.
              </p>
            </div>
            <Button onClick={handleReset} variant="outline" className="w-full" data-testid="button-try-again">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Login Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">AI Fraud Shield</CardTitle>
          <p className="text-sm text-muted-foreground">
            Secure login with real-time fraud detection
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  data-testid="input-sim-username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10"
                  required
                  disabled={simulationState === "processing"}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  data-testid="input-sim-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 pr-12"
                  required
                  disabled={simulationState === "processing"}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={simulationState === "processing"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={simulationState === "processing" || !username || !password}
              data-testid="button-simulate-login"
            >
              {simulationState === "processing" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          
          <p className="mt-4 text-xs text-center text-muted-foreground">
            This is a login simulation for testing purposes only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function getWebGLInfo(): { vendor: string; renderer: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl && 'getExtension' in gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        return {
          vendor: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown',
          renderer: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown',
        };
      }
    }
  } catch (e) {
    // Ignore errors
  }
  return { vendor: 'unknown', renderer: 'unknown' };
}
