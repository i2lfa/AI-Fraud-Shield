import { z } from "zod";
import { pgTable, text, integer, boolean, jsonb, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Database Tables
export const authUsersTable = pgTable("auth_users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  primaryDevice: text("primary_device").notNull().default("Unknown"),
  primaryRegion: text("primary_region").notNull().default("Unknown"),
  avgTypingSpeed: integer("avg_typing_speed").notNull().default(45),
  typicalLoginWindowStart: integer("typical_login_window_start").notNull().default(8),
  typicalLoginWindowEnd: integer("typical_login_window_end").notNull().default(18),
  lastLoginIp: text("last_login_ip"),
  lastLoginTime: text("last_login_time"),
  lastLoginGeo: text("last_login_geo"),
  createdAt: text("created_at").notNull(),
});

export const userBaselinesTable = pgTable("user_baselines", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email").notNull(),
  primaryDevice: text("primary_device").notNull(),
  primaryRegion: text("primary_region").notNull(),
  avgTypingSpeed: integer("avg_typing_speed").notNull().default(45),
  typicalLoginWindowStart: integer("typical_login_window_start").notNull().default(8),
  typicalLoginWindowEnd: integer("typical_login_window_end").notNull().default(18),
  riskHistory: jsonb("risk_history").notNull().default([]),
  createdAt: text("created_at").notNull(),
});

export const eventLogsTable = pgTable("event_logs", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  device: text("device").notNull(),
  deviceType: text("device_type").notNull(),
  geo: text("geo").notNull(),
  region: text("region").notNull(),
  ip: text("ip").notNull(),
  riskScore: integer("risk_score").notNull(),
  riskLevel: text("risk_level").notNull(),
  decision: text("decision").notNull(),
  breakdown: jsonb("breakdown").notNull(),
  reason: text("reason").notNull(),
  latency: integer("latency").notNull(),
  partnerId: text("partner_id"),
});

export const securityRulesTable = pgTable("security_rules", {
  id: serial("id").primaryKey(),
  blockThreshold: integer("block_threshold").notNull().default(80),
  challengeThreshold: integer("challenge_threshold").notNull().default(60),
  alertThreshold: integer("alert_threshold").notNull().default(40),
  allowThreshold: integer("allow_threshold").notNull().default(0),
  enableAutoBlock: boolean("enable_auto_block").notNull().default(true),
  enableChallenge: boolean("enable_challenge").notNull().default(true),
  enableAlerts: boolean("enable_alerts").notNull().default(true),
});

export const loginAttemptsTable = pgTable("login_attempts", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  userId: text("user_id"),
  username: text("username").notNull(),
  ip: text("ip").notNull(),
  device: text("device").notNull(),
  deviceType: text("device_type").notNull(),
  geo: text("geo").notNull(),
  region: text("region").notNull(),
  fingerprint: jsonb("fingerprint"),
  riskScore: integer("risk_score").notNull(),
  riskLevel: text("risk_level").notNull(),
  decision: text("decision").notNull(),
  breakdown: jsonb("breakdown").notNull(),
  enhancedFactors: jsonb("enhanced_factors"),
  reason: text("reason").notNull(),
  success: boolean("success").notNull(),
  requiresOtp: boolean("requires_otp").notNull(),
  loginSource: text("login_source").notNull(),
  hiddenReason: text("hidden_reason").notNull(),
  partnerId: text("partner_id"),
});

export const otpSessionsTable = pgTable("otp_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  code: text("code").notNull(),
  expiresAt: text("expires_at").notNull(),
  verified: boolean("verified").notNull().default(false),
  attempts: integer("attempts").notNull().default(0),
});

// Partner Authentication System Tables
export const partnersTable = pgTable("partners", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  clientId: text("client_id").notNull().unique(),
  clientSecretHash: text("client_secret_hash").notNull(),
  redirectUris: jsonb("redirect_uris").notNull().default([]),
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").notNull().default(true),
  rateLimitPerMinute: integer("rate_limit_per_minute").notNull().default(100),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const partnerAuthCodesTable = pgTable("partner_auth_codes", {
  id: text("id").primaryKey(),
  partnerId: text("partner_id").notNull(),
  code: text("code").notNull().unique(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  redirectUri: text("redirect_uri").notNull(),
  state: text("state"),
  riskScore: integer("risk_score").notNull(),
  riskLevel: text("risk_level").notNull(),
  decision: text("decision").notNull(),
  expiresAt: text("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const partnerTokensTable = pgTable("partner_tokens", {
  id: text("id").primaryKey(),
  partnerId: text("partner_id").notNull(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  tokenHash: text("token_hash").notNull(),
  riskSnapshot: jsonb("risk_snapshot").notNull(),
  expiresAt: text("expires_at").notNull(),
  revoked: boolean("revoked").notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export type AuthUserRow = typeof authUsersTable.$inferSelect;
export type UserBaselineRow = typeof userBaselinesTable.$inferSelect;
export type EventLogRow = typeof eventLogsTable.$inferSelect;
export type SecurityRulesRow = typeof securityRulesTable.$inferSelect;
export type LoginAttemptRow = typeof loginAttemptsTable.$inferSelect;
export type OtpSessionRow = typeof otpSessionsTable.$inferSelect;

export type RiskLevel = "critical" | "high" | "medium" | "low" | "safe";
export type Decision = "block" | "challenge" | "alert" | "allow";
export type UserRole = "user" | "admin";

export const riskBreakdownSchema = z.object({
  deviceDrift: z.number().min(0).max(30),
  geoDrift: z.number().min(0).max(25),
  typingDrift: z.number().min(0).max(25),
  timingAnomaly: z.number().min(0).max(10),
  attemptsMultiplier: z.number().min(0).max(10),
});

export type RiskBreakdown = z.infer<typeof riskBreakdownSchema>;

export const enhancedRiskFactorsSchema = z.object({
  ipReputation: z.number().min(0).max(20),
  impossibleTravel: z.number().min(0).max(25),
  velocityScore: z.number().min(0).max(15),
  browserPatternScore: z.number().min(0).max(15),
  botLikelihoodScore: z.number().min(0).max(20),
  behavioralScore: z.number().min(0).max(15),
  aiModelAnomalyScore: z.number().min(0).max(100).optional(),
});

export type EnhancedRiskFactors = z.infer<typeof enhancedRiskFactorsSchema>;

export const deviceFingerprintSchema = z.object({
  userAgent: z.string(),
  screenResolution: z.string(),
  timezone: z.string(),
  language: z.string(),
  platform: z.string(),
  cookiesEnabled: z.boolean(),
  webglRenderer: z.string().optional(),
  canvasHash: z.string().optional(),
});

export type DeviceFingerprint = z.infer<typeof deviceFingerprintSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  password: z.string(),
  role: z.enum(["user", "admin"]),
  primaryDevice: z.string(),
  primaryRegion: z.string(),
  avgTypingSpeed: z.number(),
  typicalLoginWindow: z.object({
    start: z.number(),
    end: z.number(),
  }),
  lastLoginIp: z.string().optional(),
  lastLoginTime: z.string().optional(),
  lastLoginGeo: z.string().optional(),
  createdAt: z.string(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const loginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  fingerprint: deviceFingerprintSchema.optional(),
  typingMetrics: z.object({
    avgKeyDownTime: z.number(),
    avgKeyUpTime: z.number(),
    typingSpeed: z.number(),
  }).optional(),
  loginSource: z.enum(["main", "side"]).default("main"),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const otpSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  code: z.string(),
  expiresAt: z.string(),
  verified: z.boolean(),
  attempts: z.number(),
});

export type OtpSession = z.infer<typeof otpSessionSchema>;

export const loginAttemptSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  userId: z.string().optional(),
  username: z.string(),
  ip: z.string(),
  device: z.string(),
  deviceType: z.string(),
  geo: z.string(),
  region: z.string(),
  fingerprint: deviceFingerprintSchema.optional(),
  riskScore: z.number(),
  riskLevel: z.enum(["critical", "high", "medium", "low", "safe"]),
  decision: z.enum(["block", "challenge", "alert", "allow"]),
  breakdown: riskBreakdownSchema,
  enhancedFactors: enhancedRiskFactorsSchema.optional(),
  reason: z.string(),
  success: z.boolean(),
  requiresOtp: z.boolean(),
  loginSource: z.enum(["main", "side"]),
  hiddenReason: z.string(),
});

export type LoginAttempt = z.infer<typeof loginAttemptSchema>;

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
