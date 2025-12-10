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
  riskScore: number;
  riskLevel: string;
  decision: string;
  confidence: number;
  factors: {
    deviceRisk: number;
    behaviorRisk: number;
    geoRisk: number;
    velocityRisk: number;
  };
  recommendation: string;
}

export default function SmartGateLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [nationalId, setNationalId] = useState("");
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
    const typingSpeed = Math.round((nationalId.length + password.length) / Math.max(totalTime, 0.1));

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
    
    if (!nationalId || !password) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الهوية وكلمة المرور",
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
          userIdentifier: nationalId,
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
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء التحقق من بياناتك",
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
      case "allow": return "تم السماح بالدخول";
      case "alert": return "تم السماح مع المراقبة";
      case "challenge": return "مطلوب تحقق إضافي";
      case "block": return "تم رفض الدخول";
      default: return "جاري التحقق";
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 25) return "from-green-500 to-green-600";
    if (score <= 50) return "from-yellow-500 to-yellow-600";
    if (score <= 75) return "from-orange-500 to-orange-600";
    return "from-red-500 to-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 flex flex-col" dir="rtl">
      <header className="border-b border-blue-800/30 bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/demo/smartgate">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Landmark className="h-7 w-7 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">بوابة الخدمات الذكية</span>
                <p className="text-xs text-blue-400">SmartGate</p>
              </div>
            </div>
          </Link>
          <Badge variant="outline" className="border-blue-500/50 text-blue-400">
            <Shield className="h-3 w-3 ml-1" />
            محمي بـ AI Fraud Shield
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
                <CardTitle className="text-2xl text-white">تسجيل الدخول</CardTitle>
                <CardDescription className="text-slate-400">
                  أدخل بياناتك للوصول لخدماتك الإلكترونية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="nationalId" className="text-slate-300">رقم الهوية</Label>
                    <Input
                      id="nationalId"
                      type="text"
                      placeholder="أدخل رقم الهوية"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onKeyUp={handleKeyUp}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 text-right"
                      data-testid="input-national-id"
                      dir="ltr"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300">كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="أدخل كلمة المرور"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onKeyUp={handleKeyUp}
                        className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 pl-10"
                        data-testid="input-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        جاري التحقق...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4 ml-2" />
                        تسجيل الدخول
                      </>
                    )}
                  </Button>

                  <div className="text-center space-y-2">
                    <a href="#" className="text-sm text-blue-400 hover:underline block">
                      نسيت كلمة المرور؟
                    </a>
                    <a href="#" className="text-sm text-slate-400 hover:text-white block">
                      إنشاء حساب جديد
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
                  <p className="text-slate-400 mt-2">
                    {analysis?.recommendation}
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-sm text-slate-400 mb-2">درجة المخاطرة</div>
                    <div className={`inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br ${getRiskColor(analysis?.riskScore || 0)} text-white text-2xl font-bold`}>
                      {analysis?.riskScore}
                    </div>
                    <div className="text-sm text-slate-400 mt-2">
                      مستوى: <span className="text-white">{analysis?.riskLevel}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-400">مخاطر الجهاز</div>
                      <div className="text-lg font-semibold text-white">{analysis?.factors.deviceRisk}</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-400">مخاطر السلوك</div>
                      <div className="text-lg font-semibold text-white">{analysis?.factors.behaviorRisk}</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-400">مخاطر الموقع</div>
                      <div className="text-lg font-semibold text-white">{analysis?.factors.geoRisk}</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-400">مخاطر السرعة</div>
                      <div className="text-lg font-semibold text-white">{analysis?.factors.velocityRisk}</div>
                    </div>
                  </div>

                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">تحليل AI Fraud Shield</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      معرف الجلسة: <code className="text-blue-400">{analysis?.sessionId}</code>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      نسبة الثقة: <span className="text-white">{analysis?.confidence}%</span>
                    </p>
                  </div>

                  {(analysis?.decision === "allow" || analysis?.decision === "alert") && (
                    <div className="text-center text-sm text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin inline ml-2" />
                      جاري التحويل للوحة التحكم...
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
                    >
                      المحاولة مرة أخرى
                    </Button>
                  )}

                  {analysis?.decision === "challenge" && (
                    <div className="space-y-3">
                      <Input 
                        placeholder="أدخل رمز التحقق المرسل لجوالك"
                        className="bg-slate-700/50 border-slate-600 text-white text-center"
                        data-testid="input-otp"
                      />
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600">
                        تأكيد الرمز
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <p className="text-center text-xs text-slate-500 mt-6">
            هذا موقع تجريبي لعرض كيفية عمل نظام كشف الاحتيال
          </p>
        </div>
      </main>
    </div>
  );
}
