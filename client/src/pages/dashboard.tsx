import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { RiskBadge, DecisionBadge, RiskScore } from "@/components/risk-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  ShieldAlert, 
  ShieldX, 
  Clock,
  Monitor,
  Smartphone,
  Laptop,
  Tablet
} from "lucide-react";

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
  BarChart,
  Bar,
} from "recharts";
import type { DashboardStats, EventLog } from "@shared/schema";

const RISK_COLORS = {
  critical: "hsl(0, 72%, 51%)",
  high: "hsl(25, 95%, 53%)",
  medium: "hsl(38, 92%, 50%)",
  low: "hsl(142, 71%, 45%)",
  safe: "hsl(217, 91%, 60%)",
};

function EventRow({ event }: { event: EventLog }) {
  const timeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div
      className="flex items-center gap-4 rounded-md p-3 hover-elevate"
      data-testid={`event-row-${event.id}`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
        <Activity className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{event.username}</span>
          <RiskBadge level={event.riskLevel} />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{event.geo}</span>
          <span className="opacity-50">|</span>
          <span>{event.device}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <RiskScore score={event.riskScore} size="sm" />
        <span className="text-xs text-muted-foreground">{timeAgo(event.timestamp)}</span>
      </div>
    </div>
  );
}

function GeoMap({ data }: { data: { region: string; count: number; lat: number; lng: number }[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const totalEvents = data.reduce((sum, d) => sum + d.count, 0);
  
  const regionLabels: Record<string, string> = {
    "us-east": "US East",
    "us-west": "US West",
    "eu-west": "EU West",
    "eu-central": "EU Central",
    "asia-east": "Asia Pacific",
    "asia-south": "South Asia",
    "south-america": "South America",
    "africa": "Africa",
  };
  
  return (
    <div className="relative h-64 w-full rounded-md bg-muted/30 overflow-hidden">
      <svg 
        viewBox="0 0 1000 500" 
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="mapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(217, 33%, 17%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(222, 47%, 11%)" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <rect width="1000" height="500" fill="url(#mapGradient)" />
        
        <g stroke="hsl(217, 33%, 25%)" strokeWidth="0.5" fill="none" opacity="0.6">
          <path d="M160,100 Q200,80 260,95 L280,120 Q290,150 270,180 L230,200 Q200,210 180,190 L160,150 Q150,120 160,100" />
          <path d="M280,120 Q320,100 380,110 L420,140 Q450,180 430,220 L380,250 Q340,260 300,240 L270,200 Q260,160 280,120" />
          <path d="M200,220 Q240,200 300,210 L340,250 Q360,300 330,350 L280,380 Q230,400 190,370 L160,320 Q150,260 200,220" />
          <path d="M420,80 Q500,60 580,70 L640,100 Q680,140 660,200 L600,250 Q540,280 480,260 L440,210 Q410,150 420,80" />
          <path d="M660,120 Q720,90 800,100 L860,140 Q900,190 880,260 L820,310 Q760,350 700,320 L660,260 Q640,190 660,120" />
          <path d="M640,260 Q700,240 760,260 L800,310 Q820,370 780,420 L720,450 Q660,470 620,440 L600,380 Q610,310 640,260" />
          <path d="M800,140 Q860,120 920,140 L960,200 Q980,280 940,360 L880,420 Q820,460 760,430 L740,360 Q760,280 800,220 L820,180 Q800,150 800,140" />
        </g>
        
        <g stroke="hsl(217, 33%, 20%)" strokeWidth="0.3" opacity="0.4">
          {[0, 1, 2, 3, 4].map(i => (
            <line key={`h${i}`} x1="0" y1={100 + i * 75} x2="1000" y2={100 + i * 75} strokeDasharray="4,8" />
          ))}
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <line key={`v${i}`} x1={140 + i * 120} y1="0" x2={140 + i * 120} y2="500" strokeDasharray="4,8" />
          ))}
        </g>
      </svg>
      
      <div className="absolute inset-0">
        {data.map((point, idx) => {
          const size = Math.max(16, (point.count / maxCount) * 36);
          const x = ((point.lng + 180) / 360) * 100;
          const y = ((90 - point.lat) / 180) * 100;
          const intensity = point.count / maxCount;
          const label = regionLabels[point.region] || point.region;
          
          return (
            <div
              key={idx}
              className="absolute group cursor-pointer"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
              }}
              data-testid={`geo-point-${point.region}`}
            >
              <div 
                className="absolute rounded-full bg-primary/20 animate-ping"
                style={{
                  width: size * 1.5,
                  height: size * 1.5,
                  left: `${-size * 0.25}px`,
                  top: `${-size * 0.25}px`,
                  animationDuration: "2s",
                }}
              />
              <div
                className="relative rounded-full transition-transform duration-200 group-hover:scale-125"
                style={{
                  width: size,
                  height: size,
                  background: `radial-gradient(circle at 30% 30%, hsl(217, 91%, ${60 + intensity * 20}%), hsl(217, 91%, ${40 + intensity * 10}%))`,
                  boxShadow: `0 0 ${10 + intensity * 15}px hsl(217, 91%, 60% / ${0.4 + intensity * 0.3})`,
                }}
              />
              <div className="absolute left-1/2 -translate-x-1/2 -top-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                <div className="bg-popover border border-border rounded-md px-2 py-1 shadow-lg whitespace-nowrap">
                  <div className="text-xs font-medium text-foreground">{label}</div>
                  <div className="text-xs text-muted-foreground">{point.count} events ({Math.round((point.count / totalEvents) * 100)}%)</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Geographic login distribution</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary/50" />
            <span className="text-[10px] text-muted-foreground">Low</span>
          </div>
          <div className="w-8 h-1.5 rounded-full bg-gradient-to-r from-primary/50 to-primary" />
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-[10px] text-muted-foreground">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeviceIcon({ type }: { type: string }) {
  const iconClass = "h-4 w-4";
  switch (type.toLowerCase()) {
    case "mobile":
      return <Smartphone className={iconClass} />;
    case "tablet":
      return <Tablet className={iconClass} />;
    case "laptop":
      return <Laptop className={iconClass} />;
    default:
      return <Monitor className={iconClass} />;
  }
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard"],
    refetchInterval: 3000, // Real-time updates every 3 seconds
  });

  // Redirect non-admins to login (dashboard is admin-only)
  useEffect(() => {
    if (error || (!isLoading && !stats)) {
      setLocation("/login");
    }
  }, [error, isLoading, stats, setLocation]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!stats || error) {
    return null;
  }

  const riskDistData = [
    { name: "Critical", value: stats.riskDistribution.critical, color: RISK_COLORS.critical },
    { name: "High", value: stats.riskDistribution.high, color: RISK_COLORS.high },
    { name: "Medium", value: stats.riskDistribution.medium, color: RISK_COLORS.medium },
    { name: "Low", value: stats.riskDistribution.low, color: RISK_COLORS.low },
    { name: "Safe", value: stats.riskDistribution.safe, color: RISK_COLORS.safe },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Security Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time fraud detection and monitoring</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Events"
          value={stats.totalEvents.toLocaleString()}
          icon={<Activity className="h-6 w-6" />}
          trend={{ value: 12, label: "vs last hour" }}
        />
        <StatCard
          title="High Risk %"
          value={`${stats.highRiskPercentage.toFixed(1)}%`}
          icon={<ShieldAlert className="h-6 w-6" />}
          trend={{ value: -3, label: "vs last hour" }}
        />
        <StatCard
          title="Blocked"
          value={stats.blockedCount}
          icon={<ShieldX className="h-6 w-6" />}
        />
        <StatCard
          title="Avg Response"
          value={`${stats.avgResponseTime}ms`}
          icon={<Clock className="h-6 w-6" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {riskDistData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222, 47%, 8%)",
                      border: "1px solid hsl(217, 33%, 14%)",
                      borderRadius: "6px",
                    }}
                    labelStyle={{ color: "hsl(210, 40%, 96%)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {riskDistData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                  <span className="text-xs font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Geographic Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <GeoMap data={stats.geoStats} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.deviceStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 14%)" />
                  <XAxis type="number" tick={{ fill: "hsl(215, 20%, 60%)", fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="type"
                    tick={{ fill: "hsl(215, 20%, 60%)", fontSize: 12 }}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222, 47%, 8%)",
                      border: "1px solid hsl(217, 33%, 14%)",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Risky Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topRiskyUsers.slice(0, 5).map((user, idx) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-4 rounded-md p-2 hover-elevate"
                  data-testid={`risky-user-${user.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {idx + 1}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.username}</span>
                      <span className="text-xs text-muted-foreground">{user.eventCount} events</span>
                    </div>
                  </div>
                  <RiskScore score={Math.round(user.avgRiskScore)} size="sm" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Hourly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.hourlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 14%)" />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: "hsl(215, 20%, 60%)", fontSize: 10 }}
                  />
                  <YAxis tick={{ fill: "hsl(215, 20%, 60%)", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222, 47%, 8%)",
                      border: "1px solid hsl(217, 33%, 14%)",
                      borderRadius: "6px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgRisk"
                    stroke="hsl(38, 92%, 50%)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="events"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Live Event Feed</CardTitle>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-risk-low animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <div className="space-y-1">
              {stats.recentEvents.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
