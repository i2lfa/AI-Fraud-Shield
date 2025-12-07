import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export function StatCard({ title, value, icon, trend, className = "" }: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="h-3 w-3" />;
    if (trend.value < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return "";
    if (trend.value > 0) return "text-risk-high";
    if (trend.value < 0) return "text-risk-low";
    return "text-muted-foreground";
  };

  return (
    <Card className={`${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {title}
            </span>
            <span className="text-3xl font-bold text-foreground" data-testid={`text-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </span>
            {trend && (
              <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
                {getTrendIcon()}
                <span>{Math.abs(trend.value)}% {trend.label}</span>
              </div>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
