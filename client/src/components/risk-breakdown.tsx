import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Monitor, 
  MapPin, 
  Keyboard, 
  Clock, 
  AlertTriangle 
} from "lucide-react";
import type { RiskBreakdown } from "@shared/schema";

interface RiskBreakdownCardProps {
  breakdown: RiskBreakdown;
  className?: string;
}

export function RiskBreakdownCard({ breakdown, className = "" }: RiskBreakdownCardProps) {
  const factors = [
    {
      name: "Device Drift",
      icon: Monitor,
      value: breakdown.deviceDrift,
      max: 30,
      color: "bg-chart-1",
    },
    {
      name: "Geo Drift",
      icon: MapPin,
      value: breakdown.geoDrift,
      max: 25,
      color: "bg-chart-2",
    },
    {
      name: "Typing Drift",
      icon: Keyboard,
      value: breakdown.typingDrift,
      max: 25,
      color: "bg-chart-3",
    },
    {
      name: "Timing Anomaly",
      icon: Clock,
      value: breakdown.timingAnomaly,
      max: 10,
      color: "bg-chart-4",
    },
    {
      name: "Attempts Multiplier",
      icon: AlertTriangle,
      value: breakdown.attemptsMultiplier,
      max: 10,
      color: "bg-chart-5",
    },
  ];

  const totalScore = factors.reduce((sum, f) => sum + f.value, 0);

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span>Risk Breakdown</span>
          <span className="font-mono text-2xl font-bold">{totalScore}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {factors.map((factor) => (
          <div key={factor.name} className="space-y-2" data-testid={`breakdown-${factor.name.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <factor.icon className="h-4 w-4" />
                <span>{factor.name}</span>
              </div>
              <span className="font-mono font-medium text-foreground">
                +{factor.value}
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`absolute inset-y-0 left-0 ${factor.color} transition-all duration-300`}
                style={{ width: `${(factor.value / factor.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface RiskBreakdownInlineProps {
  breakdown: RiskBreakdown;
}

export { RiskBreakdownCard as RiskBreakdown };

export function RiskBreakdownInline({ breakdown }: RiskBreakdownInlineProps) {
  const factors = [
    { name: "Device", value: breakdown.deviceDrift, color: "text-chart-1" },
    { name: "Geo", value: breakdown.geoDrift, color: "text-chart-2" },
    { name: "Typing", value: breakdown.typingDrift, color: "text-chart-3" },
    { name: "Time", value: breakdown.timingAnomaly, color: "text-chart-4" },
    { name: "Attempts", value: breakdown.attemptsMultiplier, color: "text-chart-5" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {factors.map((factor) => (
        <span key={factor.name} className={`font-mono ${factor.color}`}>
          {factor.name}: +{factor.value}
        </span>
      ))}
    </div>
  );
}
