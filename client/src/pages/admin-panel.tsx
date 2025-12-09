import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RiskBadge } from "@/components/risk-badge";
import { RiskBreakdownCard } from "@/components/risk-breakdown";
import type { LoginAttempt } from "@shared/schema";
import { 
  Shield, 
  LogOut, 
  AlertTriangle, 
  Eye,
  EyeOff,
  Fingerprint,
  Globe,
  Monitor,
  Clock,
  Activity,
  Lock,
  Zap,
  Bot,
  MapPin,
  Keyboard,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

const RISK_COLORS = {
  critical: "hsl(var(--chart-5))",
  high: "hsl(var(--chart-5))",
  medium: "hsl(var(--chart-4))",
  low: "hsl(var(--chart-2))",
  safe: "hsl(var(--chart-2))",
};

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedAttempt, setSelectedAttempt] = useState<LoginAttempt | null>(null);
  const [showHiddenReason, setShowHiddenReason] = useState<string | null>(null);

  const { data: user, isLoading: userLoading, error } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
  });

  const { data: loginAttempts, isLoading: attemptsLoading } = useQuery<LoginAttempt[]>({
    queryKey: ["/api/admin/login-attempts"],
    enabled: user?.role === "admin",
  });

  const { data: fraudRules } = useQuery({
    queryKey: ["/api/admin/fraud-rules"],
    enabled: user?.role === "admin",
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard"],
    enabled: user?.role === "admin",
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/login");
    },
  });

  if (error || (user && user.role !== "admin")) {
    setLocation("/login");
    return null;
  }

  if (userLoading || attemptsLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const attempts = loginAttempts || [];
  const blockedCount = attempts.filter(a => a.decision === "block").length;
  const challengedCount = attempts.filter(a => a.decision === "challenge").length;
  const successCount = attempts.filter(a => a.success).length;

  const decisionDistribution = [
    { name: "Allowed", value: attempts.filter(a => a.decision === "allow").length, color: "hsl(var(--chart-2))" },
    { name: "Challenged", value: challengedCount, color: "hsl(var(--chart-4))" },
    { name: "Blocked", value: blockedCount, color: "hsl(var(--chart-5))" },
  ];

  const riskTrend = attempts.slice(0, 20).reverse().map((a, i) => ({
    index: i + 1,
    score: a.riskScore,
    level: a.riskLevel,
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-chart-5/20 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-chart-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-admin-title">
              Admin Security Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Hidden fraud detection logs and decision engine
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          data-testid="button-admin-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attempts.length}</div>
            <p className="text-xs text-muted-foreground">Login attempts tracked</p>
          </CardContent>
        </Card>

        <Card className="border-chart-5/30">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <Lock className="w-4 h-4 text-chart-5" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-5">{blockedCount}</div>
            <p className="text-xs text-muted-foreground">High-risk blocked</p>
          </CardContent>
        </Card>

        <Card className="border-chart-4/30">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Challenged</CardTitle>
            <AlertTriangle className="w-4 h-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">{challengedCount}</div>
            <p className="text-xs text-muted-foreground">Required OTP</p>
          </CardContent>
        </Card>

        <Card className="border-chart-2/30">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <Zap className="w-4 h-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{successCount}</div>
            <p className="text-xs text-muted-foreground">Authenticated</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attempts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attempts" data-testid="tab-attempts">Login Attempts</TabsTrigger>
          <TabsTrigger value="hidden-rules" data-testid="tab-hidden-rules">Hidden Fraud Rules</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          <TabsTrigger value="fingerprints" data-testid="tab-fingerprints">Device Fingerprints</TabsTrigger>
        </TabsList>

        <TabsContent value="attempts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                All Login Attempts (Admin Only)
              </CardTitle>
              <CardDescription>
                Complete fraud scoring logs with hidden decision reasons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {attempts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No login attempts yet</p>
                  ) : (
                    attempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="p-4 bg-muted/50 rounded-lg space-y-3 hover-elevate cursor-pointer"
                        onClick={() => setSelectedAttempt(selectedAttempt?.id === attempt.id ? null : attempt)}
                        data-testid={`row-attempt-${attempt.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <RiskBadge level={attempt.riskLevel} score={attempt.riskScore} />
                            <div>
                              <p className="font-medium">{attempt.username}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(attempt.timestamp), "MMM d, yyyy h:mm:ss a")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={attempt.success ? "secondary" : "outline"}>
                              {attempt.success ? "Success" : "Failed"}
                            </Badge>
                            <Badge 
                              variant={
                                attempt.decision === "block" ? "destructive" : 
                                attempt.decision === "challenge" ? "outline" : 
                                "secondary"
                              }
                            >
                              {attempt.decision}
                            </Badge>
                            <Badge variant="outline">{attempt.loginSource}</Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Monitor className="w-3 h-3" />
                            {attempt.device}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {attempt.ip}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {attempt.geo}
                          </span>
                        </div>

                        <div className="p-3 bg-chart-5/10 border border-chart-5/20 rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-chart-5 flex items-center gap-1">
                              <EyeOff className="w-3 h-3" />
                              HIDDEN FRAUD REASON (Admin Only)
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowHiddenReason(showHiddenReason === attempt.id ? null : attempt.id);
                              }}
                            >
                              {showHiddenReason === attempt.id ? "Hide" : "Reveal"}
                            </Button>
                          </div>
                          {showHiddenReason === attempt.id && (
                            <p className="text-sm mt-2 font-mono text-chart-5">
                              {attempt.hiddenReason}
                            </p>
                          )}
                        </div>

                        {selectedAttempt?.id === attempt.id && (
                          <div className="pt-3 border-t space-y-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Risk Breakdown</h4>
                              <RiskBreakdownCard breakdown={attempt.breakdown} />
                            </div>
                            {attempt.enhancedFactors && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">Enhanced AI Factors</h4>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="p-2 bg-background rounded text-center">
                                    <p className="text-xs text-muted-foreground">IP Reputation</p>
                                    <p className="font-bold">{attempt.enhancedFactors.ipReputation}</p>
                                  </div>
                                  <div className="p-2 bg-background rounded text-center">
                                    <p className="text-xs text-muted-foreground">Impossible Travel</p>
                                    <p className="font-bold">{attempt.enhancedFactors.impossibleTravel}</p>
                                  </div>
                                  <div className="p-2 bg-background rounded text-center">
                                    <p className="text-xs text-muted-foreground">Velocity</p>
                                    <p className="font-bold">{attempt.enhancedFactors.velocityScore}</p>
                                  </div>
                                  <div className="p-2 bg-background rounded text-center">
                                    <p className="text-xs text-muted-foreground">Browser Pattern</p>
                                    <p className="font-bold">{attempt.enhancedFactors.browserPatternScore}</p>
                                  </div>
                                  <div className="p-2 bg-background rounded text-center">
                                    <p className="text-xs text-muted-foreground">Bot Likelihood</p>
                                    <p className="font-bold">{attempt.enhancedFactors.botLikelihoodScore}</p>
                                  </div>
                                  <div className="p-2 bg-background rounded text-center">
                                    <p className="text-xs text-muted-foreground">Behavioral</p>
                                    <p className="font-bold">{attempt.enhancedFactors.behavioralScore}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hidden-rules" className="space-y-4">
          <Card className="border-chart-5/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-chart-5">
                <EyeOff className="w-5 h-5" />
                Hidden Fraud Decision Rules
              </CardTitle>
              <CardDescription>
                These rules are NEVER exposed to users - admin view only
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(fraudRules as any)?.rules && Object.entries((fraudRules as any).rules).map(([key, value]) => (
                <div key={key} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {key}
                    </Badge>
                  </div>
                  <p className="text-sm font-mono text-muted-foreground">{value as string}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Detection Thresholds</CardTitle>
              <CardDescription>Internal scoring thresholds for enhanced fraud detection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(fraudRules as any)?.thresholds && Object.entries((fraudRules as any).thresholds).map(([key, val]) => {
                  const threshold = val as { max: number; triggerAt: number };
                  return (
                    <div key={key} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {key === "ipReputation" && <Globe className="w-4 h-4" />}
                        {key === "impossibleTravel" && <MapPin className="w-4 h-4" />}
                        {key === "velocityScore" && <Zap className="w-4 h-4" />}
                        {key === "browserPatternScore" && <Monitor className="w-4 h-4" />}
                        {key === "botLikelihoodScore" && <Bot className="w-4 h-4" />}
                        {key === "behavioralScore" && <Keyboard className="w-4 h-4" />}
                        <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Max Score:</span>
                        <span className="font-mono">{threshold.max}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Trigger At:</span>
                        <span className="font-mono text-chart-5">{threshold.triggerAt}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Risk Score Trend</CardTitle>
                <CardDescription>Last 20 login attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={riskTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="index" className="text-xs" />
                      <YAxis domain={[0, 100]} className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))' 
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="hsl(var(--chart-1))" 
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--chart-1))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Decision Distribution</CardTitle>
                <CardDescription>Breakdown by decision type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={decisionDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {decisionDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fingerprints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5" />
                Collected Device Fingerprints
              </CardTitle>
              <CardDescription>
                Browser and device information from login attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {attempts.filter(a => a.fingerprint).slice(0, 20).map((attempt) => (
                    <div
                      key={attempt.id}
                      className="p-4 bg-muted/50 rounded-lg"
                      data-testid={`row-fingerprint-${attempt.id}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">{attempt.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(attempt.timestamp), "MMM d, h:mm a")}
                        </span>
                      </div>
                      {attempt.fingerprint && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Platform:</span>
                            <span className="ml-2 font-mono text-xs">{attempt.fingerprint.platform}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Resolution:</span>
                            <span className="ml-2 font-mono text-xs">{attempt.fingerprint.screenResolution}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Timezone:</span>
                            <span className="ml-2 font-mono text-xs">{attempt.fingerprint.timezone}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Language:</span>
                            <span className="ml-2 font-mono text-xs">{attempt.fingerprint.language}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">User Agent:</span>
                            <p className="font-mono text-xs mt-1 break-all">{attempt.fingerprint.userAgent}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
