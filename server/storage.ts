import { randomUUID } from "crypto";
import type { 
  UserBaseline, 
  EventLog, 
  SecurityRules, 
  RiskBreakdown,
  DashboardStats,
  RiskLevel,
  Decision
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
}

const generateSampleUsers = (): UserBaseline[] => {
  const users: UserBaseline[] = [
    {
      id: "usr_001",
      username: "john.smith",
      email: "john.smith@company.com",
      primaryDevice: "Windows - Chrome",
      primaryRegion: "US East",
      avgTypingSpeed: 45,
      typicalLoginWindow: { start: 8, end: 18 },
      riskHistory: generateRiskHistory(14, 15, 35),
      createdAt: "2024-01-15T00:00:00Z",
    },
    {
      id: "usr_002",
      username: "sarah.jones",
      email: "sarah.jones@company.com",
      primaryDevice: "macOS - Safari",
      primaryRegion: "US West",
      avgTypingSpeed: 52,
      typicalLoginWindow: { start: 9, end: 17 },
      riskHistory: generateRiskHistory(14, 10, 25),
      createdAt: "2024-02-20T00:00:00Z",
    },
    {
      id: "usr_003",
      username: "mike.wilson",
      email: "mike.wilson@company.com",
      primaryDevice: "Windows - Firefox",
      primaryRegion: "EU West",
      avgTypingSpeed: 38,
      typicalLoginWindow: { start: 7, end: 16 },
      riskHistory: generateRiskHistory(14, 20, 55),
      createdAt: "2024-03-10T00:00:00Z",
    },
    {
      id: "usr_004",
      username: "emily.chen",
      email: "emily.chen@company.com",
      primaryDevice: "macOS - Chrome",
      primaryRegion: "Asia East",
      avgTypingSpeed: 58,
      typicalLoginWindow: { start: 10, end: 19 },
      riskHistory: generateRiskHistory(14, 8, 20),
      createdAt: "2024-04-05T00:00:00Z",
    },
    {
      id: "usr_005",
      username: "david.brown",
      email: "david.brown@company.com",
      primaryDevice: "Linux - Firefox",
      primaryRegion: "EU Central",
      avgTypingSpeed: 42,
      typicalLoginWindow: { start: 6, end: 15 },
      riskHistory: generateRiskHistory(14, 30, 70),
      createdAt: "2024-05-12T00:00:00Z",
    },
    {
      id: "usr_006",
      username: "lisa.anderson",
      email: "lisa.anderson@company.com",
      primaryDevice: "iPhone - Safari",
      primaryRegion: "US East",
      avgTypingSpeed: 35,
      typicalLoginWindow: { start: 8, end: 20 },
      riskHistory: generateRiskHistory(14, 12, 28),
      createdAt: "2024-06-01T00:00:00Z",
    },
    {
      id: "usr_007",
      username: "alex.martinez",
      email: "alex.martinez@company.com",
      primaryDevice: "Android - Chrome",
      primaryRegion: "South America",
      avgTypingSpeed: 40,
      typicalLoginWindow: { start: 9, end: 18 },
      riskHistory: generateRiskHistory(14, 25, 60),
      createdAt: "2024-06-15T00:00:00Z",
    },
    {
      id: "usr_008",
      username: "rachel.kim",
      email: "rachel.kim@company.com",
      primaryDevice: "Windows - Chrome",
      primaryRegion: "Asia South",
      avgTypingSpeed: 48,
      typicalLoginWindow: { start: 10, end: 19 },
      riskHistory: generateRiskHistory(14, 15, 40),
      createdAt: "2024-07-20T00:00:00Z",
    },
  ];
  return users;
};

function generateRiskHistory(days: number, minScore: number, maxScore: number) {
  const history = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const score = Math.round(minScore + Math.random() * (maxScore - minScore));
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
    const user = users[Math.floor(Math.random() * users.length)];
    const device = devices[Math.floor(Math.random() * devices.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const timestamp = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    
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
      ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      riskScore,
      riskLevel,
      decision,
      breakdown,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      latency: Math.floor(50 + Math.random() * 150),
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
  private logs: EventLog[];
  private rules: SecurityRules;

  constructor() {
    const sampleUsers = generateSampleUsers();
    this.users = new Map(sampleUsers.map(u => [u.id, u]));
    this.logs = generateSampleLogs(sampleUsers);
    this.rules = { ...defaultRules };
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

  async getDashboardStats(): Promise<DashboardStats> {
    const logs = this.logs;
    const users = Array.from(this.users.values());

    const totalEvents = logs.length;
    const highRiskCount = logs.filter(l => l.riskLevel === 'critical' || l.riskLevel === 'high').length;
    const highRiskPercentage = (highRiskCount / totalEvents) * 100;
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
