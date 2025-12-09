import { randomUUID } from "crypto";
import type { 
  UserBaseline, 
  EventLog, 
  SecurityRules, 
  RiskBreakdown,
  DashboardStats,
  RiskLevel,
  Decision,
  AuthUser,
  LoginAttempt,
  OtpSession,
  EnhancedRiskFactors,
} from "@shared/schema";
import { getRiskLevel, getDecision } from "@shared/schema";

export interface IStorage {
  getUsers(): Promise<UserBaseline[]>;
  getUser(id: string): Promise<UserBaseline | undefined>;
  getLogs(): Promise<EventLog[]>;
  getLogsByUser(userId: string): Promise<EventLog[]>;
  addLog(log: EventLog): Promise<EventLog>;
  getRules(): Promise<SecurityRules>;
  updateRules(rules: SecurityRules): Promise<SecurityRules>;
  getDashboardStats(): Promise<DashboardStats>;
  getAuthUser(username: string): Promise<AuthUser | undefined>;
  getAuthUserById(id: string): Promise<AuthUser | undefined>;
  getAllAuthUsers(): Promise<AuthUser[]>;
  createOtpSession(userId: string): Promise<OtpSession>;
  getOtpSession(sessionId: string): Promise<OtpSession | undefined>;
  verifyOtp(sessionId: string, code: string): Promise<boolean>;
  addLoginAttempt(attempt: LoginAttempt): Promise<LoginAttempt>;
  getLoginAttempts(): Promise<LoginAttempt[]>;
  getLoginAttemptsByUser(userId: string): Promise<LoginAttempt[]>;
}

const generateAuthUsers = (): AuthUser[] => {
  const users: AuthUser[] = [
    {
      id: "usr_000",
      username: "john",
      email: "john@company.com",
      password: "password123",
      role: "user",
      primaryDevice: "Windows - Chrome",
      primaryRegion: "US East",
      avgTypingSpeed: 45,
      typicalLoginWindow: { start: 8, end: 18 },
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
      typicalLoginWindow: { start: 8, end: 18 },
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
      typicalLoginWindow: { start: 9, end: 17 },
      createdAt: "2024-02-20T00:00:00Z",
    },
    {
      id: "usr_003",
      username: "admin",
      email: "admin@company.com",
      password: "admin123",
      role: "admin",
      primaryDevice: "Windows - Chrome",
      primaryRegion: "US East",
      avgTypingSpeed: 55,
      typicalLoginWindow: { start: 6, end: 22 },
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
      typicalLoginWindow: { start: 10, end: 19 },
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
      typicalLoginWindow: { start: 6, end: 15 },
      createdAt: "2024-05-12T00:00:00Z",
    },
  ];
  return users;
};

const generateSampleUsers = (): UserBaseline[] => {
  const authUsers = generateAuthUsers();
  return authUsers.filter(u => u.role === "user").map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    primaryDevice: u.primaryDevice,
    primaryRegion: u.primaryRegion,
    avgTypingSpeed: u.avgTypingSpeed,
    typicalLoginWindow: u.typicalLoginWindow,
    riskHistory: generateRiskHistory(14, 10, 40),
    createdAt: u.createdAt,
  }));
};

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

const generateSampleLogs = (users: UserBaseline[]): EventLog[] => {
  const logs: EventLog[] = [];
  const devices = [
    { name: "Windows - Chrome", type: "desktop" },
    { name: "macOS - Safari", type: "laptop" },
    { name: "Windows - Firefox", type: "desktop" },
    { name: "iPhone - Safari", type: "mobile" },
    { name: "Android - Chrome", type: "mobile" },
    { name: "Linux - Firefox", type: "desktop" },
    { name: "iPad - Safari", type: "tablet" },
    { name: "macOS - Chrome", type: "laptop" },
  ];
  const regions = [
    { name: "US East", code: "us-east", lat: 40.7, lng: -74.0 },
    { name: "US West", code: "us-west", lat: 37.8, lng: -122.4 },
    { name: "EU West", code: "eu-west", lat: 51.5, lng: -0.1 },
    { name: "EU Central", code: "eu-central", lat: 52.5, lng: 13.4 },
    { name: "Asia East", code: "asia-east", lat: 35.7, lng: 139.7 },
    { name: "Asia South", code: "asia-south", lat: 19.1, lng: 72.9 },
    { name: "South America", code: "south-america", lat: -23.6, lng: -46.6 },
    { name: "Africa", code: "africa", lat: -26.2, lng: 28.0 },
  ];
  const reasons = [
    "Normal login pattern detected",
    "Device changed from usual",
    "Login from new geographic location",
    "Unusual typing pattern detected",
    "Login outside typical hours",
    "Multiple failed attempts before success",
    "Device and location mismatch with baseline",
    "Suspicious keystroke dynamics",
    "First time device registration",
    "VPN or proxy detected",
  ];

  const now = new Date();
  for (let i = 0; i < 100; i++) {
    const user = users[i % users.length];
    const device = devices[i % devices.length];
    const region = regions[i % regions.length];
    const timestamp = new Date(now.getTime() - (i * 2 * 60 * 60 * 1000));
    
    const isNormalDevice = device.name === user.primaryDevice;
    const isNormalRegion = region.name === user.primaryRegion;
    const loginHour = timestamp.getHours();
    const isNormalTime = loginHour >= user.typicalLoginWindow.start && loginHour <= user.typicalLoginWindow.end;
    
    const devicePartialMatch = device.name.split(' ')[0] === user.primaryDevice.split(' ')[0];
    const typingVariation = Math.abs((i % 30) - 15);
    const attemptCount = (i % 5) + 1;
    
    const breakdown: RiskBreakdown = {
      deviceDrift: isNormalDevice ? 0 : (devicePartialMatch ? 10 : 25),
      geoDrift: isNormalRegion ? 0 : 20,
      typingDrift: Math.min(25, typingVariation),
      timingAnomaly: isNormalTime ? 0 : Math.min(10, Math.abs(loginHour - user.typicalLoginWindow.start) * 2),
      attemptsMultiplier: Math.min(10, Math.max(0, attemptCount - 1) * 2),
    };
    
    const riskScore = Math.min(100, breakdown.deviceDrift + breakdown.geoDrift + breakdown.typingDrift + breakdown.timingAnomaly + breakdown.attemptsMultiplier);
    const riskLevel = getRiskLevel(riskScore);
    const decision = getDecision(riskScore, {
      blockThreshold: 80,
      challengeThreshold: 60,
      alertThreshold: 40,
      allowThreshold: 0,
      enableAutoBlock: true,
      enableChallenge: true,
      enableAlerts: true,
    });

    logs.push({
      id: `log_${String(i + 1).padStart(3, '0')}`,
      timestamp: timestamp.toISOString(),
      userId: user.id,
      username: user.username,
      device: device.name,
      deviceType: device.type,
      geo: region.name,
      region: region.code,
      ip: `${10 + (i % 245)}.${(i * 7) % 255}.${(i * 13) % 255}.${(i * 17) % 255}`,
      riskScore,
      riskLevel,
      decision,
      breakdown,
      reason: reasons[i % reasons.length],
      latency: 50 + (i % 150),
    });
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const defaultRules: SecurityRules = {
  blockThreshold: 80,
  challengeThreshold: 60,
  alertThreshold: 40,
  allowThreshold: 0,
  enableAutoBlock: true,
  enableChallenge: true,
  enableAlerts: true,
};

export class MemStorage implements IStorage {
  private users: Map<string, UserBaseline>;
  private authUsers: Map<string, AuthUser>;
  private logs: EventLog[];
  private rules: SecurityRules;
  private otpSessions: Map<string, OtpSession>;
  private loginAttempts: LoginAttempt[];

  constructor() {
    const authUsersList = generateAuthUsers();
    this.authUsers = new Map(authUsersList.map(u => [u.username, u]));
    const sampleUsers = generateSampleUsers();
    this.users = new Map(sampleUsers.map(u => [u.id, u]));
    this.logs = generateSampleLogs(sampleUsers);
    this.rules = { ...defaultRules };
    this.otpSessions = new Map();
    this.loginAttempts = [];
  }

  async getUsers(): Promise<UserBaseline[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: string): Promise<UserBaseline | undefined> {
    return this.users.get(id);
  }

  async getLogs(): Promise<EventLog[]> {
    return this.logs;
  }

  async getLogsByUser(userId: string): Promise<EventLog[]> {
    return this.logs.filter(log => log.userId === userId);
  }

  async addLog(log: EventLog): Promise<EventLog> {
    this.logs.unshift(log);
    return log;
  }

  async getRules(): Promise<SecurityRules> {
    return this.rules;
  }

  async updateRules(rules: SecurityRules): Promise<SecurityRules> {
    this.rules = rules;
    return this.rules;
  }

  async getAuthUser(username: string): Promise<AuthUser | undefined> {
    const lowerUsername = username.toLowerCase();
    return Array.from(this.authUsers.values()).find(
      u => u.username.toLowerCase() === lowerUsername
    );
  }

  async getAuthUserById(id: string): Promise<AuthUser | undefined> {
    return Array.from(this.authUsers.values()).find(u => u.id === id);
  }

  async getAllAuthUsers(): Promise<AuthUser[]> {
    return Array.from(this.authUsers.values());
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
    this.otpSessions.set(session.id, session);
    console.log(`[OTP] Generated code ${code} for user ${userId} (session: ${session.id})`);
    return session;
  }

  async getOtpSession(sessionId: string): Promise<OtpSession | undefined> {
    return this.otpSessions.get(sessionId);
  }

  async verifyOtp(sessionId: string, code: string): Promise<boolean> {
    const session = this.otpSessions.get(sessionId);
    if (!session) return false;
    
    session.attempts++;
    if (session.attempts > 3) return false;
    if (new Date(session.expiresAt) < new Date()) return false;
    
    if (session.code === code) {
      session.verified = true;
      this.otpSessions.set(sessionId, session);
      return true;
    }
    return false;
  }

  async addLoginAttempt(attempt: LoginAttempt): Promise<LoginAttempt> {
    this.loginAttempts.unshift(attempt);
    return attempt;
  }

  async getLoginAttempts(): Promise<LoginAttempt[]> {
    return this.loginAttempts;
  }

  async getLoginAttemptsByUser(userId: string): Promise<LoginAttempt[]> {
    return this.loginAttempts.filter(a => a.userId === userId);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const logs = this.logs;

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
}

export const storage = new MemStorage();
