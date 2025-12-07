import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  getRiskLevel, 
  getDecision,
  simulationRequestSchema,
  securityRulesSchema,
  type RiskBreakdown,
  type RiskCalculationResponse,
} from "@shared/schema";

function calculateRiskBreakdown(
  params: {
    device: string;
    deviceType: string;
    geo: string;
    region: string;
    typingSpeed: number;
    loginAttempts: number;
    loginTime: number;
  },
  baseline?: {
    primaryDevice: string;
    primaryRegion: string;
    avgTypingSpeed: number;
    typicalLoginWindow: { start: number; end: number };
  }
): RiskBreakdown {
  const defaultBaseline = {
    primaryDevice: "Windows - Chrome",
    primaryRegion: "US East",
    avgTypingSpeed: 45,
    typicalLoginWindow: { start: 8, end: 18 },
  };
  
  const base = baseline || defaultBaseline;
  
  const deviceNormalized = params.device.toLowerCase().replace(/\s+/g, '-');
  const baseDeviceNormalized = base.primaryDevice.toLowerCase().replace(/\s+/g, '-');
  const deviceMatch = deviceNormalized === baseDeviceNormalized;
  const devicePartialMatch = deviceNormalized.split('-')[0] === baseDeviceNormalized.split('-')[0];
  const deviceDrift = deviceMatch ? 0 : (devicePartialMatch ? 10 : 25);
  
  const geoNormalized = params.geo.toLowerCase().replace(/\s+/g, '-');
  const baseGeoNormalized = base.primaryRegion.toLowerCase().replace(/\s+/g, '-');
  const geoMatch = geoNormalized === baseGeoNormalized || params.region === baseGeoNormalized;
  const geoDrift = geoMatch ? 0 : 20;
  
  const typingDiff = Math.abs(params.typingSpeed - base.avgTypingSpeed);
  const typingDrift = Math.min(25, Math.floor(typingDiff * 0.5));
  
  const inWindow = params.loginTime >= base.typicalLoginWindow.start && params.loginTime <= base.typicalLoginWindow.end;
  const hoursOutside = inWindow ? 0 : Math.min(
    Math.abs(params.loginTime - base.typicalLoginWindow.start),
    Math.abs(params.loginTime - base.typicalLoginWindow.end)
  );
  const timingAnomaly = inWindow ? 0 : Math.min(10, hoursOutside * 2);
  
  const attemptsMultiplier = Math.min(10, Math.max(0, params.loginAttempts - 1) * 2);

  return {
    deviceDrift,
    geoDrift,
    typingDrift,
    timingAnomaly,
    attemptsMultiplier,
  };
}

function generateExplanation(
  breakdown: RiskBreakdown,
  score: number,
  decision: string
): string {
  const factors: string[] = [];
  
  if (breakdown.deviceDrift >= 15) {
    factors.push("login from an unrecognized device");
  }
  if (breakdown.geoDrift >= 12) {
    factors.push("login from an unusual geographic location");
  }
  if (breakdown.typingDrift >= 12) {
    factors.push("typing pattern differs significantly from baseline");
  }
  if (breakdown.timingAnomaly >= 5) {
    factors.push("login occurred outside typical hours");
  }
  if (breakdown.attemptsMultiplier >= 3) {
    factors.push("multiple login attempts detected");
  }
  
  if (factors.length === 0) {
    return `Risk score of ${score} indicates normal login behavior. Session was ${decision}ed.`;
  }
  
  const factorText = factors.length === 1 
    ? factors[0] 
    : factors.slice(0, -1).join(", ") + " and " + factors[factors.length - 1];
  
  return `Risk score of ${score} triggered due to ${factorText}. Session was ${decision}ed.`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/dashboard", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/logs", async (req, res) => {
    try {
      const logs = await storage.getLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/user/:id/baseline", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user baseline" });
    }
  });

  app.get("/api/user/:id/risk-history", async (req, res) => {
    try {
      const logs = await storage.getLogsByUser(req.params.id);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risk history" });
    }
  });

  app.get("/api/rules", async (req, res) => {
    try {
      const rules = await storage.getRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rules" });
    }
  });

  app.put("/api/rules", async (req, res) => {
    try {
      const parseResult = securityRulesSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid rules data", details: parseResult.error });
      }
      const rules = await storage.updateRules(parseResult.data);
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to update rules" });
    }
  });

  app.post("/api/risk/calc", async (req, res) => {
    try {
      const { userId, device, deviceType, geo, region, typingSpeed, loginAttempts, loginTime } = req.body;
      
      const user = userId ? await storage.getUser(userId) : undefined;
      const baseline = user ? {
        primaryDevice: user.primaryDevice,
        primaryRegion: user.primaryRegion,
        avgTypingSpeed: user.avgTypingSpeed,
        typicalLoginWindow: user.typicalLoginWindow,
      } : undefined;

      const breakdown = calculateRiskBreakdown(
        { device, deviceType, geo, region, typingSpeed, loginAttempts, loginTime },
        baseline
      );

      const score = Math.min(100, 
        breakdown.deviceDrift + 
        breakdown.geoDrift + 
        breakdown.typingDrift + 
        breakdown.timingAnomaly + 
        breakdown.attemptsMultiplier
      );

      const rules = await storage.getRules();
      const level = getRiskLevel(score);
      const decision = getDecision(score, rules);
      const explanation = generateExplanation(breakdown, score, decision);

      const response: RiskCalculationResponse = {
        score,
        level,
        decision,
        breakdown,
        explanation,
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate risk" });
    }
  });

  app.post("/api/risk/simulate", async (req, res) => {
    try {
      const parseResult = simulationRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid simulation data", details: parseResult.error });
      }

      const params = parseResult.data;
      const breakdown = calculateRiskBreakdown(params);

      const score = Math.min(100, 
        breakdown.deviceDrift + 
        breakdown.geoDrift + 
        breakdown.typingDrift + 
        breakdown.timingAnomaly + 
        breakdown.attemptsMultiplier
      );

      const rules = await storage.getRules();
      const level = getRiskLevel(score);
      const decision = getDecision(score, rules);
      const explanation = generateExplanation(breakdown, score, decision);

      const response: RiskCalculationResponse = {
        score,
        level,
        decision,
        breakdown,
        explanation,
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to simulate risk" });
    }
  });

  return httpServer;
}
