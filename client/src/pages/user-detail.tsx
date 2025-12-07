import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RiskBadge, DecisionBadge, RiskScore } from "@/components/risk-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowLeft,
  Monitor,
  MapPin,
  Keyboard,
  Clock,
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import type { UserBaseline, EventLog } from "@shared/schema";

export default function UserDetail() {
  const [match, params] = useRoute("/users/:id");
  const userId = params?.id;

  const { data: user, isLoading: userLoading } = useQuery<UserBaseline>({
    queryKey: ["/api/user", userId, "baseline"],
    enabled: !!userId,
  });

  const { data: history, isLoading: historyLoading } = useQuery<EventLog[]>({
    queryKey: ["/api/user", userId, "risk-history"],
    enabled: !!userId,
  });

  if (userLoading || historyLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium">User not found</h3>
            <p className="text-sm text-muted-foreground mt-2">The requested user profile does not exist</p>
            <Link href="/users">
              <Button className="mt-4" variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const avgRisk = user.riskHistory.length > 0
    ? Math.round(user.riskHistory.reduce((sum, h) => sum + h.score, 0) / user.riskHistory.length)
    : 0;

  const getRiskLevel = (score: number) => {
    if (score >= 80) return "critical";
    if (score >= 60) return "high";
    if (score >= 40) return "medium";
    if (score >= 20) return "low";
    return "safe";
  };

  const recentTrend = user.riskHistory.length >= 2
    ? user.riskHistory[user.riskHistory.length - 1].score - user.riskHistory[user.riskHistory.length - 2].score
    : 0;

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/users">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">User Profile</h1>
          <p className="text-sm text-muted-foreground">Behavioral baseline and risk history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-4">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{user.username}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-3">
                <RiskBadge level={getRiskLevel(avgRisk)} />
                <span className="text-sm text-muted-foreground">Avg Risk: {avgRisk}</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div className="flex items-center gap-2 text-sm">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Primary Device</span>
                </div>
                <span className="text-sm font-medium">{user.primaryDevice}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Primary Region</span>
                </div>
                <span className="text-sm font-medium">{user.primaryRegion}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div className="flex items-center gap-2 text-sm">
                  <Keyboard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Typing Speed</span>
                </div>
                <span className="text-sm font-medium">{user.avgTypingSpeed} WPM</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Login Window</span>
                </div>
                <span className="text-sm font-medium">
                  {user.typicalLoginWindow.start}:00 - {user.typicalLoginWindow.end}:00
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4 p-4 rounded-md bg-muted/50">
              <div className="flex items-center gap-1">
                {recentTrend > 0 ? (
                  <TrendingUp className="h-4 w-4 text-risk-high" />
                ) : recentTrend < 0 ? (
                  <TrendingDown className="h-4 w-4 text-risk-low" />
                ) : (
                  <Activity className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={`text-sm font-medium ${recentTrend > 0 ? 'text-risk-high' : recentTrend < 0 ? 'text-risk-low' : 'text-muted-foreground'}`}>
                  {recentTrend > 0 ? '+' : ''}{recentTrend} pts
                </span>
              </div>
              <span className="text-sm text-muted-foreground">Recent trend</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Risk History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={user.riskHistory}>
                  <defs>
                    <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 14%)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "hsl(215, 20%, 60%)", fontSize: 10 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "hsl(215, 20%, 60%)", fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222, 47%, 8%)",
                      border: "1px solid hsl(217, 33%, 14%)",
                      borderRadius: "6px",
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <ReferenceLine y={80} stroke="hsl(0, 72%, 51%)" strokeDasharray="3 3" />
                  <ReferenceLine y={60} stroke="hsl(25, 95%, 53%)" strokeDasharray="3 3" />
                  <ReferenceLine y={40} stroke="hsl(38, 92%, 50%)" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth={2}
                    fill="url(#riskGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-px w-6 bg-risk-critical" style={{ opacity: 0.5 }} />
                <span className="text-xs text-muted-foreground">Critical (80+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-px w-6 bg-risk-high" style={{ opacity: 0.5 }} />
                <span className="text-xs text-muted-foreground">High (60+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-px w-6 bg-risk-medium" style={{ opacity: 0.5 }} />
                <span className="text-xs text-muted-foreground">Medium (40+)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Login History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="w-[140px]">Timestamp</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Risk</TableHead>
                  <TableHead className="text-center">Decision</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!history || history.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No login history available
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((event) => {
                    const { date, time } = formatTimestamp(event.timestamp);
                    return (
                      <TableRow key={event.id}>
                        <TableCell className="font-mono text-xs">
                          <div className="flex flex-col">
                            <span className="text-foreground">{date}</span>
                            <span className="text-muted-foreground">{time}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{event.device}</span>
                            <span className="text-xs text-muted-foreground">{event.deviceType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{event.geo}</span>
                            <span className="text-xs text-muted-foreground">{event.region}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <RiskScore score={event.riskScore} size="sm" />
                            <RiskBadge level={event.riskLevel} />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <DecisionBadge decision={event.decision} />
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            {event.reason}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
