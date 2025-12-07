import { useQuery } from "@tanstack/react-query";
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
  
  return (
    <div className="relative h-64 w-full rounded-md bg-muted/50 overflow-hidden">
      <svg viewBox="-180 -90 360 180" className="h-full w-full opacity-20">
        <rect x="-180" y="-90" width="360" height="180" fill="currentColor" className="text-muted" />
      </svg>
      <div className="absolute inset-0">
        {data.map((point, idx) => {
          const size = Math.max(8, (point.count / maxCount) * 24);
          const x = ((point.lng + 180) / 360) * 100;
          const y = ((90 - point.lat) / 180) * 100;
          return (
            <div
              key={idx}
              className="absolute rounded-full bg-primary animate-pulse"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                transform: "translate(-50%, -50%)",
                opacity: 0.6 + (point.count / maxCount) * 0.4,
              }}
              title={`${point.region}: ${point.count} events`}
            />
          );
        })}
      </div>
      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground">
        Geographic login distribution
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
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard"],
  });

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

  if (!stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    );
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
