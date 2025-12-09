import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TypingMetrics {
  avgKeyDownTime: number;
  avgKeyUpTime: number;
  typingSpeed: number;
  keystrokeCount: number;
  totalTypingTime: number;
}

export default function RealLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
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
    const charCount = email.length + password.length;
    
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

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; typingMetrics: TypingMetrics; fingerprint: any }) => {
      const response = await apiRequest("POST", "/api/auth/real-login", data);
      return response.json();
    },
    onSuccess: (data) => {
      setIsProcessing(false);
      if (data.success) {
        setLocation("/real-home");
      }
    },
    onError: () => {
      setIsProcessing(false);
      toast({
        title: "Login Failed",
        description: "Invalid email or password.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    loginMutation.mutate({
      email,
      password,
      typingMetrics: getTypingMetrics(),
      fingerprint: getDeviceFingerprint(),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  data-testid="input-real-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10"
                  required
                  disabled={isProcessing}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  data-testid="input-real-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 pr-12"
                  required
                  disabled={isProcessing}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isProcessing}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isProcessing || !email || !password}
              data-testid="button-real-login"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
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
