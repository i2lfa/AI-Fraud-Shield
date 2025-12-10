import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Landmark, 
  Shield, 
  Eye, 
  EyeOff,
  Loader2,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
} from "lucide-react";

interface TypingMetrics {
  keyDownTimes: number[];
  keyUpTimes: number[];
  typingSpeed: number;
  avgKeyDownTime: number;
  avgKeyUpTime: number;
}

interface FraudAnalysis {
  sessionId: string;
  decision: string;
  recommendation: string;
  user?: { fullName: string };
}

function OtpVerification({ 
  sessionId, 
  onSuccess, 
  onRetry 
}: { 
  sessionId: string; 
  onSuccess: () => void; 
  onRetry: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Code must be 6 digits");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const response = await fetch("/api/demo/smartgate/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, otp }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Verification Successful",
          description: "Redirecting to dashboard",
        });
        setTimeout(onSuccess, 1000);
      } else {
        setError(result.error || "Invalid verification code");
      }
    } catch (err) {
      setError("Verification error occurred");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 text-center">
        <Shield className="h-8 w-8 text-blue-400 mx-auto mb-2" />
        <p className="text-sm text-slate-300">
          A verification code has been sent to your email
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Please enter the 6-digit code
        </p>
      </div>

      <Input 
        placeholder="Enter verification code"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
        className="bg-slate-700/50 border-slate-600 text-white text-center text-2xl tracking-widest"
        data-testid="input-otp"
        maxLength={6}
      />

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      <Button 
        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600"
        onClick={handleVerify}
        disabled={isVerifying || otp.length !== 6}
        data-testid="button-verify-otp"
      >
        {isVerifying ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Verifying...
          </>
        ) : (
          "Confirm Code"
        )}
      </Button>

      <Button 
        variant="ghost" 
        className="w-full text-slate-400"
        onClick={onRetry}
        data-testid="button-back"
      >
        Back to Login
      </Button>
    </div>
  );
}

export default function SmartGateLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<FraudAnalysis | null>(null);
  
  const [typingMetrics, setTypingMetrics] = useState<TypingMetrics>({
    keyDownTimes: [],
    keyUpTimes: [],
    typingSpeed: 0,
    avgKeyDownTime: 0,
    avgKeyUpTime: 0,
  });
  
  const startTimeRef = useRef<number>(Date.now());
  const keyPressTimesRef = useRef<{ down: number; up: number }[]>([]);

  const collectFingerprint = () => {
    return {
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      colorDepth: window.screen.colorDepth,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
    };
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    keyPressTimesRef.current.push({ down: Date.now(), up: 0 });
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    const lastPress = keyPressTimesRef.current[keyPressTimesRef.current.length - 1];
    if (lastPress) {
      lastPress.up = Date.now();
    }
  };

  const calculateTypingMetrics = (): TypingMetrics => {
    const presses = keyPressTimesRef.current.filter(p => p.up > 0);
    
    if (presses.length === 0) {
      return {
        keyDownTimes: [],
        keyUpTimes: [],
        typingSpeed: 45,
        avgKeyDownTime: 80,
        avgKeyUpTime: 40,
      };
    }

    const keyDownTimes = presses.map(p => p.up - p.down);
    const keyUpTimes: number[] = [];
    for (let i = 1; i < presses.length; i++) {
      keyUpTimes.push(presses[i].down - presses[i - 1].up);
    }

    const totalTime = (Date.now() - startTimeRef.current) / 1000 / 60;
    const typingSpeed = Math.round((username.length + password.length) / Math.max(totalTime, 0.1));

    return {
      keyDownTimes,
      keyUpTimes,
      typingSpeed: Math.min(typingSpeed, 200),
      avgKeyDownTime: keyDownTimes.length > 0 
        ? Math.round(keyDownTimes.reduce((a, b) => a + b, 0) / keyDownTimes.length) 
        : 80,
      avgKeyUpTime: keyUpTimes.length > 0 
        ? Math.round(keyUpTimes.reduce((a, b) => a + b, 0) / keyUpTimes.length) 
        : 40,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter username and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const metrics = calculateTypingMetrics();
    const fingerprint = collectFingerprint();

    try {
      const response = await fetch("/api/demo/smartgate/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIdentifier: username,
          password,
          fingerprint,
          typingMetrics: {
            avgKeyDownTime: metrics.avgKeyDownTime,
            avgKeyUpTime: metrics.avgKeyUpTime,
            typingSpeed: metrics.typingSpeed,
          },
        }),
      });

      const result = await response.json();
      setAnalysis(result);
      setShowAnalysis(true);

      if (result.decision === "allow" || result.decision === "alert") {
        setTimeout(() => {
          setLocation("/demo/smartgate/dashboard");
        }, 3000);
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "An error occurred while verifying your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case "allow": return "text-green-400";
      case "alert": return "text-yellow-400";
      case "challenge": return "text-orange-400";
      case "block": return "text-red-400";
      default: return "text-slate-400";
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case "allow": return <CheckCircle className="h-12 w-12 text-green-400" />;
      case "alert": return <Info className="h-12 w-12 text-yellow-400" />;
      case "challenge": return <AlertTriangle className="h-12 w-12 text-orange-400" />;
      case "block": return <XCircle className="h-12 w-12 text-red-400" />;
      default: return <Shield className="h-12 w-12 text-slate-400" />;
    }
  };

  const getDecisionText = (decision: string) => {
    switch (decision) {
      case "allow": return "Access Granted";
      case "alert": return "Access Granted with Monitoring";
      case "challenge": return "Additional Verification Required";
      case "block": return "Access Denied";
      default: return "Verifying";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 flex flex-col">
      <header className="border-b border-blue-800/30 bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/demo/smartgate">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Landmark className="h-7 w-7 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">SmartGate</span>
                <p className="text-xs text-blue-400">Smart Services Portal</p>
              </div>
            </div>
          </Link>
          <Badge variant="outline" className="border-blue-500/50 text-blue-400">
            <Shield className="h-3 w-3 mr-1" />
            Protected by AI Fraud Shield
          </Badge>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {!showAnalysis ? (
            <Card className="bg-slate-800/80 border-blue-500/30 backdrop-blur-md">
              <CardHeader className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
                  <Landmark className="h-9 w-9 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">Sign In</CardTitle>
                <CardDescription className="text-slate-400">
                  Enter your credentials to access your services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-slate-300">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onKeyUp={handleKeyUp}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                      data-testid="input-username"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onKeyUp={handleKeyUp}
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 pr-10"
                        data-testid="input-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    disabled={isLoading}
                    data-testid="button-login"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>

                  <div className="text-center space-y-2">
                    <a href="#" className="text-sm text-blue-400 hover:underline block">
                      Forgot Password?
                    </a>
                    <a href="#" className="text-sm text-slate-400 hover:text-white block">
                      Create New Account
                    </a>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-800/80 border-blue-500/30 backdrop-blur-md">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  {getDecisionIcon(analysis?.decision || "")}
                  <h2 className={`text-2xl font-bold mt-4 ${getDecisionColor(analysis?.decision || "")}`}>
                    {getDecisionText(analysis?.decision || "")}
                  </h2>
                  {analysis?.user?.fullName && (
                    <p className="text-white mt-3 text-lg">
                      Welcome, {analysis.user.fullName}
                    </p>
                  )}
                  <p className="text-slate-400 mt-2">
                    {analysis?.recommendation}
                  </p>
                </div>

                <div className="space-y-6">
                  {(analysis?.decision === "allow" || analysis?.decision === "alert") && (
                    <div className="text-center text-sm text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                      Redirecting to dashboard...
                    </div>
                  )}

                  {analysis?.decision === "block" && (
                    <Button 
                      variant="outline" 
                      className="w-full border-slate-600 text-slate-300"
                      onClick={() => {
                        setShowAnalysis(false);
                        setAnalysis(null);
                        keyPressTimesRef.current = [];
                        startTimeRef.current = Date.now();
                      }}
                      data-testid="button-retry"
                    >
                      Try Again
                    </Button>
                  )}

                  {analysis?.decision === "challenge" && (
                    <OtpVerification 
                      sessionId={analysis.sessionId}
                      onSuccess={() => setLocation("/demo/smartgate/dashboard")}
                      onRetry={() => {
                        setShowAnalysis(false);
                        setAnalysis(null);
                        keyPressTimesRef.current = [];
                        startTimeRef.current = Date.now();
                      }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <p className="text-center text-xs text-slate-500 mt-6">
            This is a demo website showing how the fraud detection system works
          </p>
        </div>
      </main>
    </div>
  );
}
