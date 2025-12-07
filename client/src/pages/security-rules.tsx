import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Save,
  RotateCcw,
  ShieldX,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck
} from "lucide-react";
import type { SecurityRules } from "@shared/schema";

interface ThresholdCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  value: number;
  enabled: boolean;
  onValueChange: (value: number) => void;
  onEnabledChange: (enabled: boolean) => void;
  color: string;
  dataTestId: string;
}

function ThresholdCard({
  title,
  description,
  icon,
  value,
  enabled,
  onValueChange,
  onEnabledChange,
  color,
  dataTestId,
}: ThresholdCardProps) {
  return (
    <Card className={!enabled ? "opacity-60" : ""}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-md ${color}`}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={onEnabledChange}
            data-testid={`switch-${dataTestId}`}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground">Threshold</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              value={value}
              onChange={(e) => onValueChange(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-20 text-center font-mono"
              disabled={!enabled}
              data-testid={`input-${dataTestId}`}
            />
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
        </div>
        <Slider
          value={[value]}
          onValueChange={([v]) => onValueChange(v)}
          min={0}
          max={100}
          step={1}
          disabled={!enabled}
          data-testid={`slider-${dataTestId}`}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Low Risk</span>
          <span>High Risk</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SecurityRulesPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<SecurityRules | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: savedRules, isLoading } = useQuery<SecurityRules>({
    queryKey: ["/api/rules"],
  });

  const saveMutation = useMutation({
    mutationFn: async (newRules: SecurityRules) => {
      const response = await apiRequest("PUT", "/api/rules", newRules);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      setHasChanges(false);
      toast({
        title: "Rules saved",
        description: "Security rules have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save security rules. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (savedRules && !rules) {
      setRules(savedRules);
    }
  }, [savedRules]);

  const handleChange = (key: keyof SecurityRules, value: number | boolean) => {
    if (!rules) return;
    setRules({ ...rules, [key]: value });
    setHasChanges(true);
  };

  const handleReset = () => {
    if (savedRules) {
      setRules(savedRules);
      setHasChanges(false);
    }
  };

  const handleSave = () => {
    if (rules) {
      saveMutation.mutate(rules);
    }
  };

  if (isLoading || !rules) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
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
          <h1 className="text-2xl font-semibold text-foreground">Security Rules</h1>
          <p className="text-sm text-muted-foreground">Configure risk thresholds and automated responses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ThresholdCard
          title="Block"
          description="Automatically block login attempts"
          icon={<ShieldX className="h-5 w-5 text-white" />}
          value={rules.blockThreshold}
          enabled={rules.enableAutoBlock}
          onValueChange={(v) => handleChange("blockThreshold", v)}
          onEnabledChange={(v) => handleChange("enableAutoBlock", v)}
          color="bg-risk-critical"
          dataTestId="block"
        />
        <ThresholdCard
          title="Challenge"
          description="Require additional verification"
          icon={<ShieldAlert className="h-5 w-5 text-white" />}
          value={rules.challengeThreshold}
          enabled={rules.enableChallenge}
          onValueChange={(v) => handleChange("challengeThreshold", v)}
          onEnabledChange={(v) => handleChange("enableChallenge", v)}
          color="bg-risk-high"
          dataTestId="challenge"
        />
        <ThresholdCard
          title="Alert"
          description="Generate security alert for review"
          icon={<AlertTriangle className="h-5 w-5 text-white" />}
          value={rules.alertThreshold}
          enabled={rules.enableAlerts}
          onValueChange={(v) => handleChange("alertThreshold", v)}
          onEnabledChange={(v) => handleChange("enableAlerts", v)}
          color="bg-risk-medium"
          dataTestId="alert"
        />
        <Card className="flex flex-col items-center justify-center p-8 bg-muted/30">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-risk-low/20">
            <ShieldCheck className="h-8 w-8 text-risk-low" />
          </div>
          <h3 className="mt-4 text-lg font-medium">Allow</h3>
          <p className="mt-1 text-sm text-muted-foreground text-center">
            Login attempts below the alert threshold are automatically allowed
          </p>
          <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-card">
            <span className="text-sm text-muted-foreground">Score</span>
            <span className="font-mono font-medium">&lt; {rules.alertThreshold}</span>
          </div>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-risk-low animate-pulse" />
              <span className="text-sm text-muted-foreground">
                {hasChanges ? "You have unsaved changes" : "All changes saved"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges}
                data-testid="button-reset-rules"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saveMutation.isPending}
                data-testid="button-save-rules"
              >
                <Save className="mr-2 h-4 w-4" />
                {saveMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Threshold Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-12 rounded-full overflow-hidden bg-muted">
            <div
              className="absolute inset-y-0 left-0 bg-risk-low"
              style={{ width: `${rules.alertThreshold}%` }}
            />
            {rules.enableAlerts && (
              <div
                className="absolute inset-y-0 bg-risk-medium"
                style={{
                  left: `${rules.alertThreshold}%`,
                  width: `${rules.challengeThreshold - rules.alertThreshold}%`,
                }}
              />
            )}
            {rules.enableChallenge && (
              <div
                className="absolute inset-y-0 bg-risk-high"
                style={{
                  left: `${rules.challengeThreshold}%`,
                  width: `${rules.blockThreshold - rules.challengeThreshold}%`,
                }}
              />
            )}
            {rules.enableAutoBlock && (
              <div
                className="absolute inset-y-0 right-0 bg-risk-critical"
                style={{ width: `${100 - rules.blockThreshold}%` }}
              />
            )}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0</span>
            {rules.enableAlerts && (
              <span style={{ marginLeft: `${rules.alertThreshold - 5}%` }}>
                Alert: {rules.alertThreshold}
              </span>
            )}
            {rules.enableChallenge && (
              <span style={{ marginLeft: `${rules.challengeThreshold - rules.alertThreshold - 10}%` }}>
                Challenge: {rules.challengeThreshold}
              </span>
            )}
            {rules.enableAutoBlock && (
              <span style={{ marginLeft: `${rules.blockThreshold - rules.challengeThreshold - 10}%` }}>
                Block: {rules.blockThreshold}
              </span>
            )}
            <span>100</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
