import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RiskBadge, RiskScore } from "@/components/risk-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search,
  User,
  Monitor,
  MapPin,
  Keyboard,
  Clock,
  ChevronRight,
  Activity
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { UserBaseline } from "@shared/schema";

function UserCard({ user }: { user: UserBaseline }) {
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

  return (
    <Card className="hover-elevate">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-medium text-foreground truncate">{user.username}</h3>
              <RiskBadge level={getRiskLevel(avgRisk)} />
            </div>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Monitor className="h-3 w-3" />
                <span className="truncate">{user.primaryDevice}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{user.primaryRegion}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Keyboard className="h-3 w-3" />
                <span>{user.avgTypingSpeed} WPM</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{user.typicalLoginWindow.start}:00 - {user.typicalLoginWindow.end}:00</span>
              </div>
            </div>

            {user.riskHistory.length > 0 && (
              <div className="mt-4 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={user.riskHistory.slice(-7)}>
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(217, 91%, 60%)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <Link href={`/users/${user.id}`}>
            <Button variant="ghost" size="icon" data-testid={`button-view-user-${user.id}`}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UserProfiles() {
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useQuery<UserBaseline[]>({
    queryKey: ["/api/users"],
  });

  const filteredUsers = users?.filter((user) =>
    !search ||
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">User Profiles</h1>
          <p className="text-sm text-muted-foreground">Baseline behavioral profiles for all monitored users</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-users"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No users found</h3>
            <p className="text-sm text-muted-foreground">
              {search ? "Try adjusting your search" : "No user profiles available"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}
