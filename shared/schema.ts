import { z } from "zod";

export type RiskLevel = "critical" | "high" | "medium" | "low" | "safe";
export type Decision = "block" | "challenge" | "alert" | "allow";

export const riskBreakdownSchema = z.object({
  deviceDrift: z.number().min(0).max(30),
  geoDrift: z.number().min(0).max(25),
  typingDrift: z.number().min(0).max(25),
  timingAnomaly: z.number().min(0).max(10),
  attemptsMultiplier: z.number().min(0).max(10),
});

export type RiskBreakdown = z.infer<typeof riskBreakdownSchema>;

export const userBaselineSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  primaryDevice: z.string(),
  primaryRegion: z.string(),
  avgTypingSpeed: z.number(),
  typicalLoginWindow: z.object({
    start: z.number(),
    end: z.number(),
  }),
  riskHistory: z.array(z.object({
    date: z.string(),
    score: z.number(),
  })),
  createdAt: z.string(),
});

export type UserBaseline = z.infer<typeof userBaselineSchema>;

export const eventLogSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  userId: z.string(),
  username: z.string(),
  device: z.string(),
  deviceType: z.string(),
  geo: z.string(),
  region: z.string(),
  ip: z.string(),
  riskScore: z.number(),
  riskLevel: z.enum(["critical", "high", "medium", "low", "safe"]),
  decision: z.enum(["block", "challenge", "alert", "allow"]),
  breakdown: riskBreakdownSchema,
  reason: z.string(),
  latency: z.number(),
});

export type EventLog = z.infer<typeof eventLogSchema>;

export const securityRulesSchema = z.object({
  blockThreshold: z.number().min(0).max(100),
  challengeThreshold: z.number().min(0).max(100),
  alertThreshold: z.number().min(0).max(100),
  allowThreshold: z.number().min(0).max(100),
  enableAutoBlock: z.boolean(),
  enableChallenge: z.boolean(),
  enableAlerts: z.boolean(),
});

export type SecurityRules = z.infer<typeof securityRulesSchema>;

export const riskCalculationRequestSchema = z.object({
  userId: z.string(),
  device: z.string(),
  deviceType: z.string(),
  geo: z.string(),
  region: z.string(),
  typingSpeed: z.number(),
  loginAttempts: z.number(),
  loginTime: z.number(),
});

export type RiskCalculationRequest = z.infer<typeof riskCalculationRequestSchema>;

export const riskCalculationResponseSchema = z.object({
  score: z.number(),
  level: z.enum(["critical", "high", "medium", "low", "safe"]),
  decision: z.enum(["block", "challenge", "alert", "allow"]),
  breakdown: riskBreakdownSchema,
  explanation: z.string(),
});

export type RiskCalculationResponse = z.infer<typeof riskCalculationResponseSchema>;

export const simulationRequestSchema = z.object({
  device: z.string(),
  deviceType: z.string(),
  geo: z.string(),
  region: z.string(),
  typingSpeed: z.number(),
  loginAttempts: z.number(),
  loginTime: z.number(),
});

export type SimulationRequest = z.infer<typeof simulationRequestSchema>;

export const dashboardStatsSchema = z.object({
  totalEvents: z.number(),
  highRiskPercentage: z.number(),
  blockedCount: z.number(),
  avgResponseTime: z.number(),
  riskDistribution: z.object({
    critical: z.number(),
    high: z.number(),
    medium: z.number(),
    low: z.number(),
    safe: z.number(),
  }),
  deviceStats: z.array(z.object({
    type: z.string(),
    count: z.number(),
  })),
  geoStats: z.array(z.object({
    region: z.string(),
    count: z.number(),
    lat: z.number(),
    lng: z.number(),
  })),
  topRiskyUsers: z.array(z.object({
    id: z.string(),
    username: z.string(),
    avgRiskScore: z.number(),
    eventCount: z.number(),
  })),
  recentEvents: z.array(eventLogSchema),
  hourlyTrend: z.array(z.object({
    hour: z.string(),
    events: z.number(),
    avgRisk: z.number(),
  })),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  if (score >= 20) return "low";
  return "safe";
}

export function getDecision(score: number, rules: SecurityRules): Decision {
  if (rules.enableAutoBlock && score >= rules.blockThreshold) return "block";
  if (rules.enableChallenge && score >= rules.challengeThreshold) return "challenge";
  if (rules.enableAlerts && score >= rules.alertThreshold) return "alert";
  return "allow";
}
