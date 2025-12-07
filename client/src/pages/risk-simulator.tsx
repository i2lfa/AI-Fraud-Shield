import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RiskBadge, DecisionBadge, RiskScore } from "@/components/risk-badge";
import { RiskBreakdownCard } from "@/components/risk-breakdown";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  RotateCcw,
  Monitor,
  Smartphone,
  Laptop,
  MapPin,
  Keyboard,
  Clock,
  AlertTriangle,
  Zap
} from "lucide-react";
import type { RiskCalculationResponse, SimulationRequest } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const DEVICES = [
  { value: "windows-chrome", label: "Windows - Chrome", type: "desktop" },
  { value: "windows-firefox", label: "Windows - Firefox", type: "desktop" },
  { value: "macos-safari", label: "macOS - Safari", type: "laptop" },
  { value: "macos-chrome", label: "macOS - Chrome", type: "laptop" },
  { value: "iphone-safari", label: "iPhone - Safari", type: "mobile" },
  { value: "android-chrome", label: "Android - Chrome", type: "mobile" },
  { value: "ipad-safari", label: "iPad - Safari", type: "tablet" },
  { value: "linux-firefox", label: "Linux - Firefox", type: "desktop" },
];

const REGIONS = [
  { value: "us-east", label: "US East", lat: 40.7, lng: -74.0 },
  { value: "us-west", label: "US West", lat: 37.8, lng: -122.4 },
  { value: "eu-west", label: "EU West", lat: 51.5, lng: -0.1 },
  { value: "eu-central", label: "EU Central", lat: 52.5, lng: 13.4 },
  { value: "asia-east", label: "Asia East", lat: 35.7, lng: 139.7 },
  { value: "asia-south", label: "Asia South", lat: 19.1, lng: 72.9 },
  { value: "south-america", label: "South America", lat: -23.6, lng: -46.6 },
  { value: "africa", label: "Africa", lat: -26.2, lng: 28.0 },
];

const DEFAULT_VALUES: SimulationRequest = {
  device: "windows-chrome",
  deviceType: "desktop",
  geo: "US East",
  region: "us-east",
  typingSpeed: 45,
  loginAttempts: 1,
  loginTime: 10,
};

export default function RiskSimulator() {
  const [params, setParams] = useState<SimulationRequest>(DEFAULT_VALUES);
  const [result, setResult] = useState<RiskCalculationResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const simulateRisk = async () => {
    setIsSimulating(true);
    try {
      const response = await apiRequest("POST", "/api/risk/simulate", params);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Simulation failed:", error);
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      simulateRisk();
    }, 300);
    return () => clearTimeout(timer);
  }, [params]);

  const handleReset = () => {
    setParams(DEFAULT_VALUES);
  };

  const handleDeviceChange = (value: string) => {
    const device = DEVICES.find(d => d.value === value);
    if (device) {
      setParams(prev => ({
        ...prev,
        device: value,
        deviceType: device.type,
      }));
    }
  };

  const handleRegionChange = (value: string) => {
    const region = REGIONS.find(r => r.value === value);
    if (region) {
      setParams(prev => ({
        ...prev,
        region: value,
        geo: region.label,
      }));
    }
  };

  const getTimeLabel = (hour: number) => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Risk Simulator</h1>
          <p className="text-sm text-muted-foreground">Test login scenarios and see real-time risk analysis</p>
        </div>
        <Button
          variant="outline"
          onClick={handleReset}
          data-testid="button-reset-simulator"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" />
              Input Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                Device
              </Label>
              <Select
                value={params.device}
                onValueChange={handleDeviceChange}
              >
                <SelectTrigger data-testid="select-device">
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  {DEVICES.map((device) => (
                    <SelectItem key={device.value} value={device.value}>
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Geographic Region
              </Label>
              <Select
                value={params.region}
                onValueChange={handleRegionChange}
              >
                <SelectTrigger data-testid="select-region">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((region) => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <Keyboard className="h-4 w-4 text-muted-foreground" />
                  Typing Speed
                </Label>
                <span className="text-sm font-mono text-muted-foreground">
                  {params.typingSpeed} WPM
                </span>
              </div>
              <Slider
                value={[params.typingSpeed]}
                onValueChange={([value]) => setParams(prev => ({ ...prev, typingSpeed: value }))}
                min={10}
                max={120}
                step={1}
                data-testid="slider-typing-speed"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Slow</span>
                <span>Normal</span>
                <span>Fast</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  Login Attempts
                </Label>
                <span className="text-sm font-mono text-muted-foreground">
                  {params.loginAttempts}
                </span>
              </div>
              <Slider
                value={[params.loginAttempts]}
                onValueChange={([value]) => setParams(prev => ({ ...prev, loginAttempts: value }))}
                min={1}
                max={10}
                step={1}
                data-testid="slider-login-attempts"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Login Time
                </Label>
                <span className="text-sm font-mono text-muted-foreground">
                  {getTimeLabel(params.loginTime)}
                </span>
              </div>
              <Slider
                value={[params.loginTime]}
                onValueChange={([value]) => setParams(prev => ({ ...prev, loginTime: value }))}
                min={0}
                max={23}
                step={1}
                data-testid="slider-login-time"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>12 AM</span>
                <span>12 PM</span>
                <span>11 PM</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risk Assessment Result</CardTitle>
            </CardHeader>
            <CardContent>
              {isSimulating || !result ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
                    <span className="text-sm text-muted-foreground">Calculating risk...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-8 py-4">
                    <div className="flex flex-col items-center gap-2">
                      <RiskScore score={result.score} size="lg" />
                      <span className="text-sm text-muted-foreground">Risk Score</span>
                    </div>
                    <div className="h-16 w-px bg-border" />
                    <div className="flex flex-col items-center gap-2">
                      <RiskBadge level={result.level} className="text-sm px-4 py-1" />
                      <span className="text-sm text-muted-foreground">Risk Level</span>
                    </div>
                    <div className="h-16 w-px bg-border" />
                    <div className="flex flex-col items-center gap-2">
                      <DecisionBadge decision={result.decision} className="text-sm px-4 py-1" />
                      <span className="text-sm text-muted-foreground">Decision</span>
                    </div>
                  </div>

                  <div className="rounded-md bg-muted/50 p-4">
                    <h4 className="text-sm font-medium mb-2">Explanation</h4>
                    <p className="text-sm text-muted-foreground">{result.explanation}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {result && (
            <RiskBreakdownCard breakdown={result.breakdown} />
          )}
        </div>
      </div>
    </div>
  );
}
