import { randomUUID } from "crypto";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  authUsersTable, 
  userBaselinesTable, 
  eventLogsTable, 
  securityRulesTable, 
  loginAttemptsTable, 
  otpSessionsTable,
  partnersTable,
  smartgateUsersTable,
} from "@shared/schema";
import type { 
  UserBaseline, 
  EventLog, 
  SecurityRules, 
  DashboardStats,
  AuthUser,
  LoginAttempt,
  OtpSession,
  Partner,
  SmartgateUser,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DbStorage implements IStorage {
  async getUsers(): Promise<UserBaseline[]> {
    const rows = await db.select().from(userBaselinesTable);
    return rows.map(row => ({
      id: row.id,
      username: row.username,
      email: row.email,
      primaryDevice: row.primaryDevice,
      primaryRegion: row.primaryRegion,
      avgTypingSpeed: row.avgTypingSpeed,
      typicalLoginWindow: {
        start: row.typicalLoginWindowStart,
        end: row.typicalLoginWindowEnd,
      },
      riskHistory: row.riskHistory as Array<{ date: string; score: number }>,
      createdAt: row.createdAt,
    }));
  }

  async getUser(id: string): Promise<UserBaseline | undefined> {
    const rows = await db.select().from(userBaselinesTable).where(eq(userBaselinesTable.id, id));
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      primaryDevice: row.primaryDevice,
      primaryRegion: row.primaryRegion,
      avgTypingSpeed: row.avgTypingSpeed,
      typicalLoginWindow: {
        start: row.typicalLoginWindowStart,
        end: row.typicalLoginWindowEnd,
      },
      riskHistory: row.riskHistory as Array<{ date: string; score: number }>,
      createdAt: row.createdAt,
    };
  }

  async getLogs(): Promise<EventLog[]> {
    const rows = await db.select().from(eventLogsTable).orderBy(desc(eventLogsTable.timestamp));
    return rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      userId: row.userId,
      username: row.username,
      device: row.device,
      deviceType: row.deviceType,
      geo: row.geo,
      region: row.region,
      ip: row.ip,
      riskScore: row.riskScore,
      riskLevel: row.riskLevel as any,
      decision: row.decision as any,
      breakdown: row.breakdown as any,
      reason: row.reason,
      latency: row.latency,
    }));
  }

  async getLogsByUser(userId: string): Promise<EventLog[]> {
    const rows = await db.select().from(eventLogsTable)
      .where(eq(eventLogsTable.userId, userId))
      .orderBy(desc(eventLogsTable.timestamp));
    return rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      userId: row.userId,
      username: row.username,
      device: row.device,
      deviceType: row.deviceType,
      geo: row.geo,
      region: row.region,
      ip: row.ip,
      riskScore: row.riskScore,
      riskLevel: row.riskLevel as any,
      decision: row.decision as any,
      breakdown: row.breakdown as any,
      reason: row.reason,
      latency: row.latency,
    }));
  }

  async addLog(log: EventLog): Promise<EventLog> {
    await db.insert(eventLogsTable).values({
      id: log.id,
      timestamp: log.timestamp,
      userId: log.userId,
      username: log.username,
      device: log.device,
      deviceType: log.deviceType,
      geo: log.geo,
      region: log.region,
      ip: log.ip,
      riskScore: log.riskScore,
      riskLevel: log.riskLevel,
      decision: log.decision,
      breakdown: log.breakdown,
      reason: log.reason,
      latency: log.latency,
    });
    return log;
  }

  async getRules(): Promise<SecurityRules> {
    const rows = await db.select().from(securityRulesTable).limit(1);
    if (rows.length === 0) {
      const defaultRules: SecurityRules = {
        blockThreshold: 80,
        challengeThreshold: 60,
        alertThreshold: 40,
        allowThreshold: 0,
        enableAutoBlock: true,
        enableChallenge: true,
        enableAlerts: true,
      };
      await db.insert(securityRulesTable).values(defaultRules);
      return defaultRules;
    }
    const row = rows[0];
    return {
      blockThreshold: row.blockThreshold,
      challengeThreshold: row.challengeThreshold,
      alertThreshold: row.alertThreshold,
      allowThreshold: row.allowThreshold,
      enableAutoBlock: row.enableAutoBlock,
      enableChallenge: row.enableChallenge,
      enableAlerts: row.enableAlerts,
    };
  }

  async updateRules(rules: SecurityRules): Promise<SecurityRules> {
    const existing = await db.select().from(securityRulesTable).limit(1);
    if (existing.length === 0) {
      await db.insert(securityRulesTable).values({
        blockThreshold: rules.blockThreshold,
        challengeThreshold: rules.challengeThreshold,
        alertThreshold: rules.alertThreshold,
        allowThreshold: rules.allowThreshold,
        enableAutoBlock: rules.enableAutoBlock,
        enableChallenge: rules.enableChallenge,
        enableAlerts: rules.enableAlerts,
      });
    } else {
      await db.update(securityRulesTable)
        .set({
          blockThreshold: rules.blockThreshold,
          challengeThreshold: rules.challengeThreshold,
          alertThreshold: rules.alertThreshold,
          allowThreshold: rules.allowThreshold,
          enableAutoBlock: rules.enableAutoBlock,
          enableChallenge: rules.enableChallenge,
          enableAlerts: rules.enableAlerts,
        })
        .where(eq(securityRulesTable.id, existing[0].id));
    }
    return rules;
  }

  async getAuthUser(username: string): Promise<AuthUser | undefined> {
    const rows = await db.select().from(authUsersTable)
      .where(sql`LOWER(${authUsersTable.username}) = LOWER(${username})`);
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      password: row.password,
      role: row.role as any,
      primaryDevice: row.primaryDevice,
      primaryRegion: row.primaryRegion,
      avgTypingSpeed: row.avgTypingSpeed,
      typicalLoginWindow: {
        start: row.typicalLoginWindowStart,
        end: row.typicalLoginWindowEnd,
      },
      createdAt: row.createdAt,
    };
  }

  async getAuthUserById(id: string): Promise<AuthUser | undefined> {
    const rows = await db.select().from(authUsersTable).where(eq(authUsersTable.id, id));
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      password: row.password,
      role: row.role as any,
      primaryDevice: row.primaryDevice,
      primaryRegion: row.primaryRegion,
      avgTypingSpeed: row.avgTypingSpeed,
      typicalLoginWindow: {
        start: row.typicalLoginWindowStart,
        end: row.typicalLoginWindowEnd,
      },
      createdAt: row.createdAt,
    };
  }

  async getAllAuthUsers(): Promise<AuthUser[]> {
    const rows = await db.select().from(authUsersTable);
    return rows.map(row => ({
      id: row.id,
      username: row.username,
      email: row.email,
      password: row.password,
      role: row.role as any,
      primaryDevice: row.primaryDevice,
      primaryRegion: row.primaryRegion,
      avgTypingSpeed: row.avgTypingSpeed,
      typicalLoginWindow: {
        start: row.typicalLoginWindowStart,
        end: row.typicalLoginWindowEnd,
      },
      createdAt: row.createdAt,
    }));
  }

  async createOtpSession(userId: string): Promise<OtpSession> {
    const code = String(100000 + Math.floor(Math.random() * 900000));
    const session: OtpSession = {
      id: randomUUID(),
      userId,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      verified: false,
      attempts: 0,
    };
    await db.insert(otpSessionsTable).values(session);
    console.log(`\n${"=".repeat(50)}`);
    console.log(`OTP CODE: ${code}`);
    console.log(`   User: ${userId}`);
    console.log(`   Session: ${session.id}`);
    console.log(`${"=".repeat(50)}\n`);
    return session;
  }

  async getOtpSession(sessionId: string): Promise<OtpSession | undefined> {
    const rows = await db.select().from(otpSessionsTable).where(eq(otpSessionsTable.id, sessionId));
    if (rows.length === 0) return undefined;
    return rows[0];
  }

  async verifyOtp(sessionId: string, code: string): Promise<boolean> {
    const rows = await db.select().from(otpSessionsTable).where(eq(otpSessionsTable.id, sessionId));
    if (rows.length === 0) return false;
    
    const session = rows[0];
    const newAttempts = session.attempts + 1;
    
    await db.update(otpSessionsTable)
      .set({ attempts: newAttempts })
      .where(eq(otpSessionsTable.id, sessionId));
    
    if (newAttempts > 3) return false;
    if (new Date(session.expiresAt) < new Date()) return false;
    
    if (session.code === code) {
      await db.update(otpSessionsTable)
        .set({ verified: true })
        .where(eq(otpSessionsTable.id, sessionId));
      return true;
    }
    return false;
  }

  async addLoginAttempt(attempt: LoginAttempt): Promise<LoginAttempt> {
    await db.insert(loginAttemptsTable).values({
      id: attempt.id,
      timestamp: attempt.timestamp,
      userId: attempt.userId,
      username: attempt.username,
      ip: attempt.ip,
      device: attempt.device,
      deviceType: attempt.deviceType,
      geo: attempt.geo,
      region: attempt.region,
      fingerprint: attempt.fingerprint,
      riskScore: attempt.riskScore,
      riskLevel: attempt.riskLevel,
      decision: attempt.decision,
      breakdown: attempt.breakdown,
      enhancedFactors: attempt.enhancedFactors,
      reason: attempt.reason,
      success: attempt.success,
      requiresOtp: attempt.requiresOtp,
      loginSource: attempt.loginSource,
      hiddenReason: attempt.hiddenReason,
    });
    return attempt;
  }

  async getLoginAttempts(): Promise<LoginAttempt[]> {
    const rows = await db.select().from(loginAttemptsTable).orderBy(desc(loginAttemptsTable.timestamp));
    return rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      userId: row.userId ?? undefined,
      username: row.username,
      ip: row.ip,
      device: row.device,
      deviceType: row.deviceType,
      geo: row.geo,
      region: row.region,
      fingerprint: row.fingerprint as any,
      riskScore: row.riskScore,
      riskLevel: row.riskLevel as any,
      decision: row.decision as any,
      breakdown: row.breakdown as any,
      enhancedFactors: row.enhancedFactors as any,
      reason: row.reason,
      success: row.success,
      requiresOtp: row.requiresOtp,
      loginSource: row.loginSource as "main" | "side",
      hiddenReason: row.hiddenReason,
    }));
  }

  async getLoginAttemptsByUser(userId: string): Promise<LoginAttempt[]> {
    const rows = await db.select().from(loginAttemptsTable)
      .where(eq(loginAttemptsTable.userId, userId))
      .orderBy(desc(loginAttemptsTable.timestamp));
    return rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      userId: row.userId ?? undefined,
      username: row.username,
      ip: row.ip,
      device: row.device,
      deviceType: row.deviceType,
      geo: row.geo,
      region: row.region,
      fingerprint: row.fingerprint as any,
      riskScore: row.riskScore,
      riskLevel: row.riskLevel as any,
      decision: row.decision as any,
      breakdown: row.breakdown as any,
      enhancedFactors: row.enhancedFactors as any,
      reason: row.reason,
      success: row.success,
      requiresOtp: row.requiresOtp,
      loginSource: row.loginSource as "main" | "side",
      hiddenReason: row.hiddenReason,
    }));
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const logs = await this.getLogs();

    if (logs.length === 0) {
      return {
        totalEvents: 0,
        highRiskPercentage: 0,
        blockedCount: 0,
        avgResponseTime: 0,
        riskDistribution: { critical: 0, high: 0, medium: 0, low: 0, safe: 0 },
        deviceStats: [],
        geoStats: [],
        topRiskyUsers: [],
        recentEvents: [],
        hourlyTrend: [],
      };
    }

    const totalEvents = logs.length;
    const highRiskCount = logs.filter(l => l.riskLevel === 'critical' || l.riskLevel === 'high').length;
    const highRiskPercentage = Math.round((highRiskCount / totalEvents) * 100);
    const blockedCount = logs.filter(l => l.decision === 'block').length;
    const avgResponseTime = Math.round(logs.reduce((sum, l) => sum + l.latency, 0) / logs.length);

    const riskDistribution = {
      critical: logs.filter(l => l.riskLevel === 'critical').length,
      high: logs.filter(l => l.riskLevel === 'high').length,
      medium: logs.filter(l => l.riskLevel === 'medium').length,
      low: logs.filter(l => l.riskLevel === 'low').length,
      safe: logs.filter(l => l.riskLevel === 'safe').length,
    };

    const deviceCounts: Record<string, number> = {};
    logs.forEach(l => {
      deviceCounts[l.deviceType] = (deviceCounts[l.deviceType] || 0) + 1;
    });
    const deviceStats = Object.entries(deviceCounts).map(([type, count]) => ({ type, count }));

    const geoCounts: Record<string, { count: number; lat: number; lng: number }> = {};
    const geoCoords: Record<string, { lat: number; lng: number }> = {
      "us-east": { lat: 40.7, lng: -74.0 },
      "us-west": { lat: 37.8, lng: -122.4 },
      "eu-west": { lat: 51.5, lng: -0.1 },
      "eu-central": { lat: 52.5, lng: 13.4 },
      "asia-east": { lat: 35.7, lng: 139.7 },
      "asia-south": { lat: 19.1, lng: 72.9 },
      "south-america": { lat: -23.6, lng: -46.6 },
      "africa": { lat: -26.2, lng: 28.0 },
    };
    logs.forEach(l => {
      if (!geoCounts[l.region]) {
        const coords = geoCoords[l.region] || { lat: 0, lng: 0 };
        geoCounts[l.region] = { count: 0, ...coords };
      }
      geoCounts[l.region].count++;
    });
    const geoStats = Object.entries(geoCounts).map(([region, data]) => ({
      region,
      count: data.count,
      lat: data.lat,
      lng: data.lng,
    }));

    const userRisks: Record<string, { scores: number[]; username: string }> = {};
    logs.forEach(l => {
      if (!userRisks[l.userId]) {
        userRisks[l.userId] = { scores: [], username: l.username };
      }
      userRisks[l.userId].scores.push(l.riskScore);
    });
    const topRiskyUsers = Object.entries(userRisks)
      .map(([id, data]) => ({
        id,
        username: data.username,
        avgRiskScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
        eventCount: data.scores.length,
      }))
      .sort((a, b) => b.avgRiskScore - a.avgRiskScore)
      .slice(0, 5);

    const hourlyData: Record<string, { events: number; totalRisk: number }> = {};
    for (let i = 0; i < 24; i++) {
      const hour = String(i).padStart(2, '0');
      hourlyData[hour] = { events: 0, totalRisk: 0 };
    }
    logs.forEach(l => {
      const hour = String(new Date(l.timestamp).getHours()).padStart(2, '0');
      hourlyData[hour].events++;
      hourlyData[hour].totalRisk += l.riskScore;
    });
    const hourlyTrend = Object.entries(hourlyData).map(([hour, data]) => ({
      hour: `${hour}:00`,
      events: data.events,
      avgRisk: data.events > 0 ? Math.round(data.totalRisk / data.events) : 0,
    }));

    return {
      totalEvents,
      highRiskPercentage,
      blockedCount,
      avgResponseTime,
      riskDistribution,
      deviceStats,
      geoStats,
      topRiskyUsers,
      recentEvents: logs.slice(0, 20),
      hourlyTrend,
    };
  }

  // Partner methods
  async createPartner(partner: Omit<Partner, 'id' | 'createdAt' | 'updatedAt' | 'totalRequests' | 'blockedRequests'>): Promise<Partner> {
    const now = new Date().toISOString();
    const newPartner = {
      ...partner,
      id: `partner_${randomUUID()}`,
      totalRequests: 0,
      blockedRequests: 0,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(partnersTable).values(newPartner);
    return newPartner;
  }

  async getPartnerByClientId(clientId: string): Promise<Partner | undefined> {
    const rows = await db.select().from(partnersTable).where(eq(partnersTable.clientId, clientId));
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      clientId: row.clientId,
      clientSecretHash: row.clientSecretHash,
      webhookUrl: row.webhookUrl ?? undefined,
      webhookSecret: row.webhookSecret ?? undefined,
      logoUrl: row.logoUrl ?? undefined,
      isActive: row.isActive,
      rateLimitPerMinute: row.rateLimitPerMinute,
      totalRequests: row.totalRequests,
      blockedRequests: row.blockedRequests,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async getPartnerById(id: string): Promise<Partner | undefined> {
    const rows = await db.select().from(partnersTable).where(eq(partnersTable.id, id));
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      clientId: row.clientId,
      clientSecretHash: row.clientSecretHash,
      webhookUrl: row.webhookUrl ?? undefined,
      webhookSecret: row.webhookSecret ?? undefined,
      logoUrl: row.logoUrl ?? undefined,
      isActive: row.isActive,
      rateLimitPerMinute: row.rateLimitPerMinute,
      totalRequests: row.totalRequests,
      blockedRequests: row.blockedRequests,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async getAllPartners(): Promise<Partner[]> {
    const rows = await db.select().from(partnersTable);
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      clientId: row.clientId,
      clientSecretHash: row.clientSecretHash,
      webhookUrl: row.webhookUrl ?? undefined,
      webhookSecret: row.webhookSecret ?? undefined,
      logoUrl: row.logoUrl ?? undefined,
      isActive: row.isActive,
      rateLimitPerMinute: row.rateLimitPerMinute,
      totalRequests: row.totalRequests,
      blockedRequests: row.blockedRequests,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async updatePartner(id: string, updates: Partial<Partner>): Promise<Partner | undefined> {
    const existing = await this.getPartnerById(id);
    if (!existing) return undefined;
    
    await db.update(partnersTable)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(partnersTable.id, id));
    
    return this.getPartnerById(id);
  }

  async incrementPartnerStats(partnerId: string, blocked: boolean): Promise<void> {
    const partner = await this.getPartnerById(partnerId);
    if (partner) {
      await db.update(partnersTable)
        .set({
          totalRequests: partner.totalRequests + 1,
          blockedRequests: blocked ? partner.blockedRequests + 1 : partner.blockedRequests,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(partnersTable.id, partnerId));
    }
  }

  async getLogsByPartner(partnerId: string): Promise<EventLog[]> {
    const rows = await db.select().from(eventLogsTable)
      .where(eq(eventLogsTable.partnerId, partnerId))
      .orderBy(desc(eventLogsTable.timestamp));
    return rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      userId: row.userId,
      username: row.username,
      device: row.device,
      deviceType: row.deviceType,
      geo: row.geo,
      region: row.region,
      ip: row.ip,
      riskScore: row.riskScore,
      riskLevel: row.riskLevel as any,
      decision: row.decision as any,
      breakdown: row.breakdown as any,
      reason: row.reason,
      latency: row.latency,
    }));
  }

  async getLoginAttemptsByPartner(partnerId: string): Promise<LoginAttempt[]> {
    const rows = await db.select().from(loginAttemptsTable)
      .where(eq(loginAttemptsTable.partnerId, partnerId))
      .orderBy(desc(loginAttemptsTable.timestamp));
    return rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      userId: row.userId ?? undefined,
      username: row.username,
      ip: row.ip,
      device: row.device,
      deviceType: row.deviceType,
      geo: row.geo,
      region: row.region,
      fingerprint: row.fingerprint as any,
      riskScore: row.riskScore,
      riskLevel: row.riskLevel as any,
      decision: row.decision as any,
      breakdown: row.breakdown as any,
      enhancedFactors: row.enhancedFactors as any,
      reason: row.reason,
      success: row.success,
      requiresOtp: row.requiresOtp,
      loginSource: row.loginSource as "main" | "side",
      hiddenReason: row.hiddenReason,
    }));
  }

  // SmartGate Demo Methods
  async getSmartgateUser(username: string): Promise<SmartgateUser | undefined> {
    const rows = await db.select().from(smartgateUsersTable).where(eq(smartgateUsersTable.username, username));
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return {
      id: row.id,
      username: row.username,
      password: row.password,
      fullName: row.fullName,
      email: row.email ?? undefined,
      primaryDevice: row.primaryDevice,
      primaryRegion: row.primaryRegion,
      avgTypingSpeed: row.avgTypingSpeed,
      lastLoginIp: row.lastLoginIp ?? undefined,
      lastLoginTime: row.lastLoginTime ?? undefined,
      createdAt: row.createdAt,
    };
  }

  async getSmartgateUserById(id: string): Promise<SmartgateUser | undefined> {
    const rows = await db.select().from(smartgateUsersTable).where(eq(smartgateUsersTable.id, id));
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return {
      id: row.id,
      username: row.username,
      password: row.password,
      fullName: row.fullName,
      email: row.email ?? undefined,
      primaryDevice: row.primaryDevice,
      primaryRegion: row.primaryRegion,
      avgTypingSpeed: row.avgTypingSpeed,
      lastLoginIp: row.lastLoginIp ?? undefined,
      lastLoginTime: row.lastLoginTime ?? undefined,
      createdAt: row.createdAt,
    };
  }

  async createSmartgateUser(user: Omit<SmartgateUser, 'id' | 'createdAt'>): Promise<SmartgateUser> {
    const id = `sg_${randomUUID()}`;
    const createdAt = new Date().toISOString();
    await db.insert(smartgateUsersTable).values({
      id,
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      email: user.email,
      primaryDevice: user.primaryDevice,
      primaryRegion: user.primaryRegion,
      avgTypingSpeed: user.avgTypingSpeed,
      lastLoginIp: user.lastLoginIp,
      lastLoginTime: user.lastLoginTime,
      createdAt,
    });
    return { ...user, id, createdAt };
  }

  async updateSmartgateUser(id: string, updates: Partial<SmartgateUser>): Promise<SmartgateUser | undefined> {
    const existing = await this.getSmartgateUserById(id);
    if (!existing) return undefined;
    
    const updateData: any = {};
    if (updates.lastLoginIp !== undefined) updateData.lastLoginIp = updates.lastLoginIp;
    if (updates.lastLoginTime !== undefined) updateData.lastLoginTime = updates.lastLoginTime;
    if (updates.primaryDevice !== undefined) updateData.primaryDevice = updates.primaryDevice;
    if (updates.avgTypingSpeed !== undefined) updateData.avgTypingSpeed = updates.avgTypingSpeed;
    
    if (Object.keys(updateData).length > 0) {
      await db.update(smartgateUsersTable).set(updateData).where(eq(smartgateUsersTable.id, id));
    }
    
    return { ...existing, ...updates };
  }

  async getAllSmartgateUsers(): Promise<SmartgateUser[]> {
    const rows = await db.select().from(smartgateUsersTable);
    return rows.map(row => ({
      id: row.id,
      username: row.username,
      password: row.password,
      fullName: row.fullName,
      email: row.email ?? undefined,
      primaryDevice: row.primaryDevice,
      primaryRegion: row.primaryRegion,
      avgTypingSpeed: row.avgTypingSpeed,
      lastLoginIp: row.lastLoginIp ?? undefined,
      lastLoginTime: row.lastLoginTime ?? undefined,
      createdAt: row.createdAt,
    }));
  }
}

export async function seedDatabase() {
  const existingUsers = await db.select().from(authUsersTable).limit(1);
  if (existingUsers.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  console.log("Seeding database with initial data...");

  const authUsers = [
    {
      id: "usr_000",
      username: "john",
      email: "alphapp9@gmail.com",
      password: "password123",
      role: "user",
      primaryDevice: "Windows - Chrome",
      primaryRegion: "US East",
      avgTypingSpeed: 45,
      typicalLoginWindowStart: 8,
      typicalLoginWindowEnd: 18,
      createdAt: "2024-01-10T00:00:00Z",
    },
    {
      id: "usr_001",
      username: "john.smith",
      email: "john.smith@company.com",
      password: "password123",
      role: "user",
      primaryDevice: "Windows - Chrome",
      primaryRegion: "US East",
      avgTypingSpeed: 45,
      typicalLoginWindowStart: 8,
      typicalLoginWindowEnd: 18,
      createdAt: "2024-01-15T00:00:00Z",
    },
    {
      id: "usr_002",
      username: "sarah.jones",
      email: "sarah.jones@company.com",
      password: "password123",
      role: "user",
      primaryDevice: "macOS - Safari",
      primaryRegion: "US West",
      avgTypingSpeed: 52,
      typicalLoginWindowStart: 9,
      typicalLoginWindowEnd: 17,
      createdAt: "2024-02-20T00:00:00Z",
    },
    {
      id: "usr_003",
      username: "admin",
      email: "abdulmalikfaa@gmail.com",
      password: "admin123",
      role: "admin",
      primaryDevice: "Windows - Chrome",
      primaryRegion: "US East",
      avgTypingSpeed: 55,
      typicalLoginWindowStart: 6,
      typicalLoginWindowEnd: 22,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "usr_004",
      username: "emily.chen",
      email: "emily.chen@company.com",
      password: "password123",
      role: "user",
      primaryDevice: "macOS - Chrome",
      primaryRegion: "Asia East",
      avgTypingSpeed: 58,
      typicalLoginWindowStart: 10,
      typicalLoginWindowEnd: 19,
      createdAt: "2024-04-05T00:00:00Z",
    },
    {
      id: "usr_005",
      username: "david.brown",
      email: "david.brown@company.com",
      password: "password123",
      role: "user",
      primaryDevice: "Linux - Firefox",
      primaryRegion: "EU Central",
      avgTypingSpeed: 42,
      typicalLoginWindowStart: 6,
      typicalLoginWindowEnd: 15,
      createdAt: "2024-05-12T00:00:00Z",
    },
  ];

  await db.insert(authUsersTable).values(authUsers);

  const userBaselines = authUsers.filter(u => u.role === "user").map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    primaryDevice: u.primaryDevice,
    primaryRegion: u.primaryRegion,
    avgTypingSpeed: u.avgTypingSpeed,
    typicalLoginWindowStart: u.typicalLoginWindowStart,
    typicalLoginWindowEnd: u.typicalLoginWindowEnd,
    riskHistory: generateRiskHistory(14, 10, 40),
    createdAt: u.createdAt,
  }));

  await db.insert(userBaselinesTable).values(userBaselines);

  await db.insert(securityRulesTable).values({
    blockThreshold: 80,
    challengeThreshold: 60,
    alertThreshold: 40,
    allowThreshold: 0,
    enableAutoBlock: true,
    enableChallenge: true,
    enableAlerts: true,
  });

  // Seed event logs for dashboard data
  await seedEventLogs();

  console.log("Database seeded successfully!");
}

function generateRiskHistory(days: number, minScore: number, maxScore: number) {
  const history = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const score = Math.round(minScore + ((i * 7) % (maxScore - minScore)));
    history.push({
      date: date.toISOString().split('T')[0],
      score,
    });
  }
  return history;
}

async function seedEventLogs() {
  const devices = ["Windows - Chrome", "macOS - Safari", "Linux - Firefox", "macOS - Chrome", "Windows - Edge"];
  const deviceTypes = ["desktop", "desktop", "desktop", "desktop", "desktop"];
  const regions = ["US East", "US West", "EU Central", "Asia East", "Asia West"];
  const geos = ["New York, US", "San Francisco, US", "Frankfurt, DE", "Tokyo, JP", "Singapore, SG"];
  const ips = ["192.168.1.1", "10.0.0.1", "172.16.0.1", "203.0.113.1", "198.51.100.1"];
  const users = ["usr_000", "usr_001", "usr_002", "usr_004", "usr_005"];
  const usernames = ["john", "john.smith", "sarah.jones", "emily.chen", "david.brown"];
  
  const events = [];
  const now = new Date();
  
  for (let i = 0; i < 50; i++) {
    const userIndex = Math.floor(Math.random() * users.length);
    const regionIndex = Math.floor(Math.random() * regions.length);
    const deviceIndex = Math.floor(Math.random() * devices.length);
    const riskScore = Math.floor(Math.random() * 100);
    const decision = riskScore >= 80 ? "block" : riskScore >= 60 ? "challenge" : riskScore >= 40 ? "alert" : "allow";
    const riskLevel = riskScore >= 80 ? "critical" : riskScore >= 60 ? "high" : riskScore >= 40 ? "medium" : riskScore >= 20 ? "low" : "safe";
    
    const timestamp = new Date(now);
    timestamp.setHours(timestamp.getHours() - Math.floor(Math.random() * 72));
    
    events.push({
      id: `evt_${String(i).padStart(3, '0')}`,
      timestamp: timestamp.toISOString(),
      userId: users[userIndex],
      username: usernames[userIndex],
      device: devices[deviceIndex],
      deviceType: deviceTypes[deviceIndex],
      geo: geos[regionIndex],
      region: regions[regionIndex],
      ip: ips[Math.floor(Math.random() * ips.length)],
      riskScore,
      riskLevel,
      decision,
      breakdown: { deviceDrift: 5, geoDrift: 10, typingDrift: 8, timingAnomaly: 3, attemptsMultiplier: 0 },
      reason: `Login attempt with risk score ${riskScore}`,
      latency: Math.floor(Math.random() * 200) + 50,
    });
  }
  
  await db.insert(eventLogsTable).values(events);
}

export async function ensureEventLogsExist() {
  const existingLogs = await db.select().from(eventLogsTable).limit(1);
  if (existingLogs.length === 0) {
    console.log("Seeding event logs...");
    await seedEventLogs();
    console.log("Event logs seeded!");
  }
}
