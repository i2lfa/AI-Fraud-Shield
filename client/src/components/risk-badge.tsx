import { Badge } from "@/components/ui/badge";
import type { RiskLevel, Decision } from "@shared/schema";

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export function RiskBadge({ level, className = "" }: RiskBadgeProps) {
  const colors: Record<RiskLevel, string> = {
    critical: "bg-risk-critical/20 text-risk-critical border-risk-critical/30",
    high: "bg-risk-high/20 text-risk-high border-risk-high/30",
    medium: "bg-risk-medium/20 text-risk-medium border-risk-medium/30",
    low: "bg-risk-low/20 text-risk-low border-risk-low/30",
    safe: "bg-risk-safe/20 text-risk-safe border-risk-safe/30",
  };

  return (
    <Badge
      variant="outline"
      className={`uppercase text-xs font-semibold tracking-wide ${colors[level]} ${className}`}
      data-testid={`badge-risk-${level}`}
    >
      {level}
    </Badge>
  );
}

interface DecisionBadgeProps {
  decision: Decision;
  className?: string;
}

export function DecisionBadge({ decision, className = "" }: DecisionBadgeProps) {
  const colors: Record<Decision, string> = {
    block: "bg-risk-critical/20 text-risk-critical border-risk-critical/30",
    challenge: "bg-risk-high/20 text-risk-high border-risk-high/30",
    alert: "bg-risk-medium/20 text-risk-medium border-risk-medium/30",
    allow: "bg-risk-low/20 text-risk-low border-risk-low/30",
  };

  return (
    <Badge
      variant="outline"
      className={`uppercase text-xs font-semibold tracking-wide ${colors[decision]} ${className}`}
      data-testid={`badge-decision-${decision}`}
    >
      {decision}
    </Badge>
  );
}

interface RiskScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RiskScore({ score, size = "md", className = "" }: RiskScoreProps) {
  const getColor = (s: number) => {
    if (s >= 80) return "text-risk-critical";
    if (s >= 60) return "text-risk-high";
    if (s >= 40) return "text-risk-medium";
    if (s >= 20) return "text-risk-low";
    return "text-risk-safe";
  };

  const sizes = {
    sm: "text-lg font-semibold",
    md: "text-2xl font-bold",
    lg: "text-4xl font-bold",
  };

  return (
    <span
      className={`font-mono ${sizes[size]} ${getColor(score)} ${className}`}
      data-testid="text-risk-score"
    >
      {score}
    </span>
  );
}
