import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, User, KeyRound, Fingerprint, Cpu, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TypingMetrics {
  avgKeyDownTime: number;
  avgKeyUpTime: number;
  typingSpeed: number;
}

export default function SideLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  
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
        loginSource: "side",
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
        toast({
          title: "Verification Required",
          description: "Check console for OTP code.",
        });
      } else if (data.success) {
        toast({
          title: "Access Granted",
          description: `Authenticated as ${data.user.username}`,
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
        title: "Access Denied",
        description: error.message || "Authentication failed.",
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
        toast({ title: "Verified", description: "Access granted." });
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
        description: "Invalid code.",
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
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-chart-2 via-chart-3 to-chart-4 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border border-white/30 rounded-full" />
          <div className="absolute top-40 right-32 w-48 h-48 border border-white/20 rounded-full" />
          <div className="absolute bottom-32 left-40 w-24 h-24 border border-white/40 rounded-full" />
          <div className="absolute bottom-20 right-20 w-40 h-40 border border-white/25 rounded-full" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-xl font-semibold">AI Fraud Shield</span>
          </div>
        </div>
        
        <div className="relative z-10 text-white space-y-8">
          <h1 className="text-4xl font-bold leading-tight">
            Advanced Security<br />Authentication Portal
          </h1>
          <p className="text-white/80 text-lg max-w-md">
            Alternative access point with enhanced biometric verification and real-time threat analysis.
          </p>
          
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3">
              <Fingerprint className="w-6 h-6" />
              <span className="text-sm">Biometric Analysis</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3">
              <Cpu className="w-6 h-6" />
              <span className="text-sm">AI Detection</span>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-white/60 text-sm">
          Secure Alternative Login Portal v2.0
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-semibold">AI Fraud Shield</span>
            </div>
            <h2 className="text-2xl font-bold">
              {requiresOtp ? "Verify Identity" : "Alternative Access"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {requiresOtp ? "Enter your verification code" : "Secure secondary authentication portal"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!requiresOtp ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="username"
                      data-testid="input-side-username"
                      type="text"
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="pl-11 h-12 bg-muted/50 border-muted-foreground/20"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      data-testid="input-side-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="pl-11 pr-11 h-12 bg-muted/50 border-muted-foreground/20"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-chart-4/20 border border-chart-4/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <KeyRound className="w-5 h-5 text-chart-4 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-chart-4">OTP Required</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        For demo: Check the <strong>"Start application"</strong> workflow output to find your code.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Look for: <code className="bg-muted px-1 rounded text-xs">[OTP] Generated code XXXXXX</code>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    data-testid="input-side-otp"
                    type="text"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-3xl tracking-[0.5em] h-14 font-mono"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              data-testid="button-side-login"
              className="w-full h-12 text-base"
              disabled={loginMutation.isPending || otpMutation.isPending}
            >
              {loginMutation.isPending || otpMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                requiresOtp ? "Verify" : "Authenticate"
              )}
            </Button>
          </form>

          <div className="text-center pt-4 border-t border-muted">
            <p className="text-sm text-muted-foreground mb-2">Test Accounts:</p>
            <p className="text-xs text-muted-foreground">
              user: john.smith / password123 | admin: admin / admin123
            </p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => setLocation("/login")}
              data-testid="link-main-login"
            >
              Switch to main login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
