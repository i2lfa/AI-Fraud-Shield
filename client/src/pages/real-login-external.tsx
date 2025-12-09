import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, User, Eye, EyeOff, Loader2, CheckCircle, XCircle, RotateCcw, Building2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TypingMetrics {
  avgKeyDownTime: number;
  avgKeyUpTime: number;
  typingSpeed: number;
  keystrokeCount: number;
  totalTypingTime: number;
  keyIntervals: number[];
}

type LoginState = "form" | "processing" | "success" | "failure";

export default function RealLoginExternal() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginState, setLoginState] = useState<LoginState>("form");
  const [pageLoadTime] = useState(Date.now());
  
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
        typingSpeed: charCount > 0 ? Math.round((charCount / Math.max(totalTime, 1)) * 60 / 5) : 0,
        keystrokeCount: times.length,
        totalTypingTime: totalTime * 1000,
        keyIntervals: intervals,
      };
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const typingSpeed = Math.round((charCount / totalTime) * 60 / 5);
    
    return {
      avgKeyDownTime: Math.round(avgInterval * 0.6),
      avgKeyUpTime: Math.round(avgInterval * 0.4),
      typingSpeed: Math.min(200, Math.max(0, typingSpeed)),
      keystrokeCount: times.length,
      totalTypingTime: Math.round(totalTime * 1000),
      keyIntervals: intervals.slice(-20),
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
    canvasFingerprint: getCanvasFingerprint(),
    windowSize: `${window.innerWidth}x${window.innerHeight}`,
    pixelRatio: window.devicePixelRatio,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/real-login-external", data);
      return response.json();
    },
    onSuccess: (data) => {
      setLoginState(data.success ? "success" : "failure");
    },
    onError: () => {
      setLoginState("failure");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginState("processing");
    
    const payload = {
      username: username || "",
      password: password || "",
      typingMetrics: getTypingMetrics(),
      fingerprint: getDeviceFingerprint(),
      pageLoadTime: Date.now() - pageLoadTime,
      submitTimestamp: new Date().toISOString(),
    };
    
    loginMutation.mutate(payload);
  };

  const handleReset = () => {
    setUsername("");
    setPassword("");
    setLoginState("form");
    keyTimesRef.current = [];
    keyIntervalsRef.current = [];
    startTimeRef.current = Date.now();
    lastKeyTimeRef.current = 0;
  };

  if (loginState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="mx-auto w-24 h-24 bg-chart-2/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-chart-2" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-chart-2" data-testid="text-login-success">Welcome Back</h2>
              <p className="text-muted-foreground text-sm">
                Your login was successful.
              </p>
            </div>
            <Button onClick={handleReset} variant="outline" className="w-full" data-testid="button-login-again">
              <RotateCcw className="w-4 h-4 mr-2" />
              Login Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loginState === "failure") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="mx-auto w-24 h-24 bg-destructive/20 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-destructive" data-testid="text-login-failed">Access Denied</h2>
              <p className="text-muted-foreground text-sm">
                Unable to verify your credentials.
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-xl">Company Portal</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to access your account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username or Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  data-testid="input-ext-username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10"
                  disabled={loginState === "processing"}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  data-testid="input-ext-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 pr-12"
                  disabled={loginState === "processing"}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loginState === "processing"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginState === "processing"}
              data-testid="button-ext-login"
            >
              {loginState === "processing" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <a href="#" className="text-xs text-muted-foreground hover:text-primary">
              Forgot your password?
            </a>
          </div>
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
  } catch (e) {}
  return { vendor: 'unknown', renderer: 'unknown' };
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('fingerprint', 2, 2);
      return canvas.toDataURL().slice(-50);
    }
  } catch (e) {}
  return 'unknown';
}
