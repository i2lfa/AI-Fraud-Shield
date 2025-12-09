import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { 
  Brain, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Keyboard,
  Globe,
  Clock,
  Monitor,
  Bot,
  Fingerprint,
  Play,
  RotateCcw,
} from "lucide-react";

interface PredictionResult {
  isAnomaly: boolean;
  score: number;
  confidence: number;
  riskLevel: string;
  decision: string;
  breakdown: {
    typingScore: number;
    deviceScore: number;
    geoScore: number;
    timeScore: number;
    velocityScore: number;
  };
}

interface ModelStatus {
  modelId: string;
  version: number;
  isReady: boolean;
  trainedAt: string | null;
  samplesCount: number;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
}

export default function ModelPlayground() {
  const [typingSpeed, setTypingSpeed] = useState(50);
  const [keystrokeCount, setKeystrokeCount] = useState(25);
  const [totalTypingTime, setTotalTypingTime] = useState(5000);
  const [hourOfDay, setHourOfDay] = useState(14);
  const [dayOfWeek, setDayOfWeek] = useState("2");
  const [deviceConsistency, setDeviceConsistency] = useState(0.9);
  const [geoDistance, setGeoDistance] = useState(50);
  const [attemptCount, setAttemptCount] = useState(1);
  const [fingerprintStability, setFingerprintStability] = useState(0.85);
  const [passwordCorrect, setPasswordCorrect] = useState("1");
  
  const [result, setResult] = useState<PredictionResult | null>(null);

  const { data: modelStatus, isLoading: statusLoading } = useQuery<ModelStatus>({
    queryKey: ["/api/admin/model/status"],
  });

  const predictMutation = useMutation({
    mutationFn: async (features: any) => {
      const response = await apiRequest("POST", "/api/model/predict", features);
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const handlePredict = () => {
    predictMutation.mutate({
      typingSpeed,
      keystrokeCount,
      totalTypingTime,
      hourOfDay,
      dayOfWeek: parseInt(dayOfWeek),
      deviceConsistency,
      geoDistance,
      attemptCount,
      fingerprintStability,
      passwordCorrect: parseInt(passwordCorrect),
    });
  };

  const handleReset = () => {
    setTypingSpeed(50);
    setKeystrokeCount(25);
    setTotalTypingTime(5000);
    setHourOfDay(14);
    setDayOfWeek("2");
    setDeviceConsistency(0.9);
    setGeoDistance(50);
    setAttemptCount(1);
    setFingerprintStability(0.85);
    setPasswordCorrect("1");
    setResult(null);
  };

  const presets = {
    normal: () => {
      setTypingSpeed(55);
      setKeystrokeCount(22);
      setTotalTypingTime(4500);
      setHourOfDay(10);
      setDayOfWeek("1");
      setDeviceConsistency(0.95);
      setGeoDistance(10);
      setAttemptCount(1);
      setFingerprintStability(0.9);
      setPasswordCorrect("1");
    },
    suspicious: () => {
      setTypingSpeed(150);
      setKeystrokeCount(8);
      setTotalTypingTime(800);
      setHourOfDay(3);
      setDayOfWeek("6");
      setDeviceConsistency(0.3);
      setGeoDistance(2000);
      setAttemptCount(5);
      setFingerprintStability(0.2);
      setPasswordCorrect("0");
    },
    bot: () => {
      setTypingSpeed(200);
      setKeystrokeCount(50);
      setTotalTypingTime(200);
      setHourOfDay(4);
      setDayOfWeek("0");
      setDeviceConsistency(0.1);
      setGeoDistance(5000);
      setAttemptCount(10);
      setFingerprintStability(0.1);
      setPasswordCorrect("0");
    },
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Model Playground</h1>
            <p className="text-sm text-muted-foreground">
              Test the fraud detection ML model with custom inputs
            </p>
          </div>
        </div>
        
        {statusLoading ? (
          <Skeleton className="h-8 w-32" />
        ) : modelStatus?.isReady ? (
          <Badge className="bg-chart-2/20 text-chart-2 border-chart-2/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Model v{modelStatus.version} Ready
          </Badge>
        ) : (
          <Badge className="bg-chart-4/20 text-chart-4 border-chart-4/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Model Training
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={presets.normal} data-testid="button-preset-normal">
          Normal Login
        </Button>
        <Button variant="outline" size="sm" onClick={presets.suspicious} data-testid="button-preset-suspicious">
          Suspicious Login
        </Button>
        <Button variant="outline" size="sm" onClick={presets.bot} data-testid="button-preset-bot">
          Bot Pattern
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Input Features
            </CardTitle>
            <CardDescription>
              Adjust the parameters to simulate different login behaviors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Keyboard className="w-4 h-4 text-chart-1" />
                  Typing Dynamics
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Typing Speed (WPM)</Label>
                    <span className="text-muted-foreground">{typingSpeed}</span>
                  </div>
                  <Slider
                    value={[typingSpeed]}
                    onValueChange={([v]) => setTypingSpeed(v)}
                    min={10}
                    max={200}
                    step={1}
                    data-testid="slider-typing-speed"
                  />
                  <p className="text-xs text-muted-foreground">Normal: 40-70, Bot: 150+</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Keystroke Count</Label>
                    <span className="text-muted-foreground">{keystrokeCount}</span>
                  </div>
                  <Slider
                    value={[keystrokeCount]}
                    onValueChange={([v]) => setKeystrokeCount(v)}
                    min={5}
                    max={100}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Total Typing Time (ms)</Label>
                    <span className="text-muted-foreground">{totalTypingTime}</span>
                  </div>
                  <Slider
                    value={[totalTypingTime]}
                    onValueChange={([v]) => setTotalTypingTime(v)}
                    min={100}
                    max={20000}
                    step={100}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="w-4 h-4 text-chart-3" />
                  Time Analysis
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Hour of Day</Label>
                    <span className="text-muted-foreground">{hourOfDay}:00</span>
                  </div>
                  <Slider
                    value={[hourOfDay]}
                    onValueChange={([v]) => setHourOfDay(v)}
                    min={0}
                    max={23}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">Normal: 9-18, Suspicious: 0-5</p>
                </div>

                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger data-testid="select-day">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sunday</SelectItem>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Monitor className="w-4 h-4 text-chart-2" />
                  Device & Location
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Device Consistency</Label>
                    <span className="text-muted-foreground">{(deviceConsistency * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[deviceConsistency]}
                    onValueChange={([v]) => setDeviceConsistency(v)}
                    min={0}
                    max={1}
                    step={0.05}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Geo Distance (km)</Label>
                    <span className="text-muted-foreground">{geoDistance}</span>
                  </div>
                  <Slider
                    value={[geoDistance]}
                    onValueChange={([v]) => setGeoDistance(v)}
                    min={0}
                    max={10000}
                    step={50}
                  />
                  <p className="text-xs text-muted-foreground">0-100: Same area, 1000+: Different region</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Fingerprint className="w-4 h-4 text-chart-4" />
                  Security Signals
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Login Attempts</Label>
                    <span className="text-muted-foreground">{attemptCount}</span>
                  </div>
                  <Slider
                    value={[attemptCount]}
                    onValueChange={([v]) => setAttemptCount(v)}
                    min={1}
                    max={20}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Fingerprint Stability</Label>
                    <span className="text-muted-foreground">{(fingerprintStability * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[fingerprintStability]}
                    onValueChange={([v]) => setFingerprintStability(v)}
                    min={0}
                    max={1}
                    step={0.05}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Password Correct</Label>
                  <Select value={passwordCorrect} onValueChange={setPasswordCorrect}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Yes</SelectItem>
                      <SelectItem value="0">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handlePredict} 
                disabled={predictMutation.isPending}
                data-testid="button-run-prediction"
              >
                <Play className="w-4 h-4 mr-2" />
                {predictMutation.isPending ? "Analyzing..." : "Run Prediction"}
              </Button>
              <Button variant="outline" onClick={handleReset} data-testid="button-reset">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Prediction Result
            </CardTitle>
            <CardDescription>
              ML model analysis output
            </CardDescription>
          </CardHeader>
          <CardContent>
            {predictMutation.isPending ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-4xl font-bold mb-1" data-testid="text-anomaly-score">
                    {result.score}
                  </div>
                  <div className="text-sm text-muted-foreground">Anomaly Score</div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  {result.isAnomaly ? (
                    <Badge className="bg-chart-5/20 text-chart-5 border-chart-5/30" data-testid="badge-anomaly">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Anomaly Detected
                    </Badge>
                  ) : (
                    <Badge className="bg-chart-2/20 text-chart-2 border-chart-2/30" data-testid="badge-normal">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Normal Pattern
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">{result.confidence}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Risk Level</span>
                    <Badge variant="outline" className="capitalize">{result.riskLevel}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Decision</span>
                    <Badge variant="outline" className="capitalize">{result.decision}</Badge>
                  </div>
                </div>

                {result.breakdown && (
                  <div className="pt-4 border-t space-y-2">
                    <div className="text-sm font-medium mb-2">Feature Contributions</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Typing</span>
                        <span>{result.breakdown.typingScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Device</span>
                        <span>{result.breakdown.deviceScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Geo</span>
                        <span>{result.breakdown.geoScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time</span>
                        <span>{result.breakdown.timeScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Velocity</span>
                        <span>{result.breakdown.velocityScore}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Adjust the inputs and click "Run Prediction" to see the model's analysis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {modelStatus?.metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Current Model Performance</CardTitle>
            <CardDescription>
              Based on {modelStatus.samplesCount} training samples
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-2xl font-bold text-chart-2">
                  {(modelStatus.metrics.accuracy * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-2xl font-bold text-chart-3">
                  {(modelStatus.metrics.precision * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Precision</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-2xl font-bold text-chart-4">
                  {(modelStatus.metrics.recall * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Recall</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="text-2xl font-bold text-chart-1">
                  {(modelStatus.metrics.f1Score * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">F1 Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
