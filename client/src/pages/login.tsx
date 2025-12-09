import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, User, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TypingMetrics {
  avgKeyDownTime: number;
  avgKeyUpTime: number;
  typingSpeed: number;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSessionId, setOtpSessionId] = useState("");
  
  const keyTimesRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  const handleKeyDown = () => {
    keyTimesRef.current.push(Date.now());
  };

  const getTypingMetrics = (): TypingMetrics => {
    const times = keyTimesRef.current;
    if (times.length < 2) {
      return { avgKeyDownTime: 100, avgKeyUpTime: 50, typingSpeed: 45 };
    }
    const intervals = [];
    for (let i = 1; i < times.length; i++) {
      intervals.push(times[i] - times[i - 1]);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const totalTime = (Date.now() - startTimeRef.current) / 1000;
    const typingSpeed = Math.round((username.length + password.length) / totalTime * 60 / 5);
    
    return {
      avgKeyDownTime: Math.round(avgInterval * 0.6),
      avgKeyUpTime: Math.round(avgInterval * 0.4),
      typingSpeed: Math.min(200, Math.max(10, typingSpeed)),
    };
  };

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; typingMetrics: TypingMetrics }) => {
      const response = await apiRequest("POST", "/api/auth/login", {
        ...data,
        loginSource: "main",
        fingerprint: {
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform,
          cookiesEnabled: navigator.cookieEnabled,
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.requiresOtp) {
        setRequiresOtp(true);
        setOtpSessionId(data.otpSessionId);
        toast({
          title: "Verification Required",
          description: "Please check the console for your OTP code (simulated SMS).",
        });
      } else if (data.success) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.user.username}!`,
        });
        if (data.user.role === "admin") {
          setLocation("/admin");
        } else {
          setLocation("/user-dashboard");
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials or access denied.",
        variant: "destructive",
      });
    },
  });

  const otpMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/auth/verify-otp", { code });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Verification Successful",
          description: "You have been authenticated.",
        });
        if (data.user?.role === "admin") {
          setLocation("/admin");
        } else {
          setLocation("/user-dashboard");
        }
      }
    },
    onError: () => {
      toast({
        title: "Verification Failed",
        description: "Invalid or expired OTP code.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requiresOtp) {
      otpMutation.mutate(otpCode);
    } else {
      loginMutation.mutate({
        username,
        password,
        typingMetrics: getTypingMetrics(),
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chart-1/5 rounded-full blur-3xl" />
      </div>
      
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">AI Fraud Shield</CardTitle>
            <CardDescription className="mt-2">
              {requiresOtp ? "Enter verification code" : "Secure login with real-time fraud detection"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!requiresOtp ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="username"
                      data-testid="input-username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      data-testid="input-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-chart-4/20 border border-chart-4/30 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-chart-4 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-chart-4">Additional Verification Required</p>
                    <p className="text-muted-foreground mt-1">
                      For demo: Check the <strong>"Start application"</strong> workflow output in the Replit panel to find your 6-digit OTP code.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Look for: <code className="bg-muted px-1 rounded">[OTP] Generated code XXXXXX</code>
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    data-testid="input-otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
            )}
            
            <Button
              type="submit"
              data-testid="button-login"
              className="w-full"
              disabled={loginMutation.isPending || otpMutation.isPending}
            >
              {loginMutation.isPending || otpMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {requiresOtp ? "Verifying..." : "Authenticating..."}
                </span>
              ) : (
                requiresOtp ? "Verify Code" : "Sign In"
              )}
            </Button>
          </form>
          
        </CardContent>
      </Card>
    </div>
  );
}
