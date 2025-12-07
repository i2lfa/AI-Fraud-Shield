import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RiskBadge, DecisionBadge, RiskScore } from "@/components/risk-badge";
import { RiskBreakdownCard } from "@/components/risk-breakdown";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User,
  Activity,
  Monitor,
  MapPin,
  Keyboard,
  Clock,
  AlertTriangle,
  ArrowRight,
  Percent
} from "lucide-react";
import type { EventLog, UserBaseline } from "@shared/schema";

interface DriftIndicatorProps {
  label: string;
  icon: React.ReactNode;
  current: string;
  baseline: string;
  driftPercent: number;
}

function DriftIndicator({ label, icon, current, baseline, driftPercent }: DriftIndicatorProps) {
  const getDriftColor = (pct: number) => {
    if (pct >= 50) return "text-risk-critical";
    if (pct >= 30) return "text-risk-high";
    if (pct >= 15) return "text-risk-medium";
    return "text-risk-low";
  };

  return (
    <div className="p-4 rounded-md bg-muted/50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <span className={`text-sm font-mono font-medium ${getDriftColor(driftPercent)}`}>
          {driftPercent}% drift
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 text-center p-2 rounded bg-card">
          <span className="text-xs text-muted-foreground block">Baseline</span>
          <span className="text-sm font-medium">{baseline}</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 text-center p-2 rounded bg-card">
          <span className="text-xs text-muted-foreground block">Current</span>
          <span className="text-sm font-medium">{current}</span>
        </div>
      </div>
    </div>
  );
}

export default function BehaviorAnalysis() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  const { data: users, isLoading: usersLoading } = useQuery<UserBaseline[]>({
    queryKey: ["/api/users"],
  });

  const { data: logs, isLoading: logsLoading } = useQuery<EventLog[]>({
    queryKey: ["/api/logs"],
  });

  const selectedUser = users?.find(u => u.id === selectedUserId);
  const userEvents = logs?.filter(l => l.userId === selectedUserId) || [];
  const selectedEvent = userEvents.find(e => e.id === selectedEventId);

  const calculateDrift = () => {
    if (!selectedUser || !selectedEvent) return null;
    
    const deviceMatch = selectedEvent.device === selectedUser.primaryDevice;
    const deviceDrift = deviceMatch ? 0 : Math.round((selectedEvent.breakdown.deviceDrift / 30) * 100);
    
    const baseRegionNormalized = selectedUser.primaryRegion.toLowerCase().replace(/\s+/g, '-');
    const geoMatch = selectedEvent.region === baseRegionNormalized;
    const geoDrift = geoMatch ? 0 : Math.round((selectedEvent.breakdown.geoDrift / 25) * 100);
    
    const typingDrift = Math.round((selectedEvent.breakdown.typingDrift / 25) * 100);
    const timeDrift = Math.round((selectedEvent.breakdown.timingAnomaly / 10) * 100);
    
    return { deviceDrift, geoDrift, typingDrift, timeDrift };
  };

  const drifts = calculateDrift();

  if (usersLoading || logsLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Behavior Analysis</h1>
          <p className="text-sm text-muted-foreground">Detailed analysis of user behavior vs baseline</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1 max-w-xs">
          <Select value={selectedUserId} onValueChange={(v) => {
            setSelectedUserId(v);
            setSelectedEventId("");
          }}>
            <SelectTrigger data-testid="select-user">
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {users?.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedUserId && userEvents.length > 0 && (
          <div className="flex-1 max-w-xs">
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger data-testid="select-event">
                <SelectValue placeholder="Select a login event" />
              </SelectTrigger>
              <SelectContent>
                {userEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {new Date(event.timestamp).toLocaleString()} - Score: {event.riskScore}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {!selectedUserId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <User className="h-16 w-16 text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-medium">Select a User</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a user to analyze their behavioral patterns
            </p>
          </CardContent>
        </Card>
      ) : !selectedEvent ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">User Baseline</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedUser && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-primary/10 text-primary text-xl">
                        {selectedUser.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{selectedUser.username}</h3>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-4 rounded-md bg-muted/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Monitor className="h-4 w-4" />
                        <span>Primary Device</span>
                      </div>
                      <p className="font-medium">{selectedUser.primaryDevice}</p>
                    </div>
                    <div className="p-4 rounded-md bg-muted/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <MapPin className="h-4 w-4" />
                        <span>Primary Region</span>
                      </div>
                      <p className="font-medium">{selectedUser.primaryRegion}</p>
                    </div>
                    <div className="p-4 rounded-md bg-muted/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Keyboard className="h-4 w-4" />
                        <span>Avg Typing Speed</span>
                      </div>
                      <p className="font-medium">{selectedUser.avgTypingSpeed} WPM</p>
                    </div>
                    <div className="p-4 rounded-md bg-muted/50">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        <span>Login Window</span>
                      </div>
                      <p className="font-medium">
                        {selectedUser.typicalLoginWindow.start}:00 - {selectedUser.typicalLoginWindow.end}:00
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center justify-center h-full py-16">
              <Activity className="h-16 w-16 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-medium">Select an Event</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a login event to analyze against the baseline
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">User Baseline</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedUser && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {selectedUser.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedUser.username}</h3>
                      <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Device</span>
                      <span className="font-medium">{selectedUser.primaryDevice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Region</span>
                      <span className="font-medium">{selectedUser.primaryRegion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Typing</span>
                      <span className="font-medium">{selectedUser.avgTypingSpeed} WPM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hours</span>
                      <span className="font-medium">
                        {selectedUser.typicalLoginWindow.start}-{selectedUser.typicalLoginWindow.end}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>Analysis Result</span>
                <span className="text-sm font-mono text-muted-foreground">
                  {new Date(selectedEvent.timestamp).toLocaleString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-8 py-4 mb-6 rounded-md bg-muted/50">
                <div className="flex flex-col items-center gap-1">
                  <RiskScore score={selectedEvent.riskScore} size="lg" />
                  <span className="text-sm text-muted-foreground">Risk Score</span>
                </div>
                <div className="h-12 w-px bg-border" />
                <div className="flex flex-col items-center gap-1">
                  <RiskBadge level={selectedEvent.riskLevel} className="text-sm" />
                  <span className="text-sm text-muted-foreground">Level</span>
                </div>
                <div className="h-12 w-px bg-border" />
                <div className="flex flex-col items-center gap-1">
                  <DecisionBadge decision={selectedEvent.decision} className="text-sm" />
                  <span className="text-sm text-muted-foreground">Decision</span>
                </div>
              </div>

              <div className="rounded-md bg-muted/50 p-4 mb-6">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Reason
                </h4>
                <p className="text-sm text-muted-foreground">{selectedEvent.reason}</p>
              </div>

              {drifts && selectedUser && (
                <div className="grid grid-cols-2 gap-4">
                  <DriftIndicator
                    label="Device"
                    icon={<Monitor className="h-4 w-4" />}
                    current={selectedEvent.device}
                    baseline={selectedUser.primaryDevice}
                    driftPercent={drifts.deviceDrift}
                  />
                  <DriftIndicator
                    label="Location"
                    icon={<MapPin className="h-4 w-4" />}
                    current={selectedEvent.geo}
                    baseline={selectedUser.primaryRegion}
                    driftPercent={drifts.geoDrift}
                  />
                  <DriftIndicator
                    label="Typing"
                    icon={<Keyboard className="h-4 w-4" />}
                    current={`${Math.round(selectedUser.avgTypingSpeed + (selectedEvent.breakdown.typingDrift * 2))} WPM`}
                    baseline={`${selectedUser.avgTypingSpeed} WPM`}
                    driftPercent={Math.round(drifts.typingDrift)}
                  />
                  <DriftIndicator
                    label="Time"
                    icon={<Clock className="h-4 w-4" />}
                    current={new Date(selectedEvent.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    baseline={`${selectedUser.typicalLoginWindow.start}:00 - ${selectedUser.typicalLoginWindow.end}:00`}
                    driftPercent={Math.round(drifts.timeDrift)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
            <RiskBreakdownCard breakdown={selectedEvent.breakdown} />
          </div>
        </div>
      )}
    </div>
  );
}
