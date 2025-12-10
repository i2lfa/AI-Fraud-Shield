import { pgTable, text, integer, boolean, jsonb, timestamp, serial, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const authUsers = pgTable("auth_users", {
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

export const userBaselines = pgTable("user_baselines", {
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

export const eventLogs = pgTable("event_logs", {
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
});

export const securityRules = pgTable("security_rules", {
  id: serial("id").primaryKey(),
  blockThreshold: integer("block_threshold").notNull().default(80),
  challengeThreshold: integer("challenge_threshold").notNull().default(60),
  alertThreshold: integer("alert_threshold").notNull().default(40),
  allowThreshold: integer("allow_threshold").notNull().default(0),
  enableAutoBlock: boolean("enable_auto_block").notNull().default(true),
  enableChallenge: boolean("enable_challenge").notNull().default(true),
  enableAlerts: boolean("enable_alerts").notNull().default(true),
});

export const loginAttempts = pgTable("login_attempts", {
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
});

export const otpSessions = pgTable("otp_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  code: text("code").notNull(),
  expiresAt: text("expires_at").notNull(),
  verified: boolean("verified").notNull().default(false),
  attempts: integer("attempts").notNull().default(0),
});

export const insertAuthUserSchema = createInsertSchema(authUsers).omit({ createdAt: true });
export const insertUserBaselineSchema = createInsertSchema(userBaselines).omit({ createdAt: true });
export const insertEventLogSchema = createInsertSchema(eventLogs);
export const insertLoginAttemptSchema = createInsertSchema(loginAttempts);
export const insertOtpSessionSchema = createInsertSchema(otpSessions);

export type InsertAuthUser = z.infer<typeof insertAuthUserSchema>;
export type InsertUserBaseline = z.infer<typeof insertUserBaselineSchema>;
export type InsertEventLog = z.infer<typeof insertEventLogSchema>;
export type InsertLoginAttempt = z.infer<typeof insertLoginAttemptSchema>;
export type InsertOtpSession = z.infer<typeof insertOtpSessionSchema>;

export type AuthUserRow = typeof authUsers.$inferSelect;
export type UserBaselineRow = typeof userBaselines.$inferSelect;
export type EventLogRow = typeof eventLogs.$inferSelect;
export type SecurityRulesRow = typeof securityRules.$inferSelect;
export type LoginAttemptRow = typeof loginAttempts.$inferSelect;
export type OtpSessionRow = typeof otpSessions.$inferSelect;
