import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { fraudModel, extractTrainingFeatures } from "./ml-model";
import { fanOutLoginAttempt, maskIpAddress } from "./monitoring-hub";
import { 
  getRiskLevel, 
  getDecision,
  simulationRequestSchema,
  securityRulesSchema,
  loginRequestSchema,
  type RiskBreakdown,
  type RiskCalculationResponse,
  type LoginAttempt,
  type EnhancedRiskFactors,
} from "@shared/schema";

interface SessionData {
  userId?: string;
  username?: string;
  role?: "user" | "admin";
  otpSessionId?: string;
  pendingLogin?: boolean;
}

interface RequestWithSession extends Request {
  session: SessionData & {
    destroy: (callback: (err?: Error) => void) => void;
  };
}

const hiddenFraudReasons: Record<string, string> = {
  "high_velocity": "HIDDEN: Multiple login attempts detected within short timeframe - velocity check triggered",
  "impossible_travel": "HIDDEN: Login from geographically impossible location given previous login time",
  "ip_blacklisted": "HIDDEN: IP address flagged in threat intelligence database",
  "bot_detected": "HIDDEN: Click timing and interaction patterns match bot signature",
  "browser_anomaly": "HIDDEN: Browser fingerprint inconsistencies detected - possible spoofing",
  "device_mismatch": "HIDDEN: Device fingerprint does not match user baseline profile",
  "geo_mismatch": "HIDDEN: Login region differs significantly from established baseline",
  "typing_anomaly": "HIDDEN: Keystroke dynamics deviate from user behavioral profile",
  "time_anomaly": "HIDDEN: Login time outside user's typical activity window",
  "normal": "HIDDEN: All checks passed - normal login pattern",
};

function calculateEnhancedRiskFactors(
  ip: string,
  lastLoginIp?: string,
  lastLoginTime?: string,
  lastLoginGeo?: string,
  currentGeo?: string,
  typingMetrics?: { avgKeyDownTime: number; avgKeyUpTime: number; typingSpeed: number },
  fingerprint?: any
): EnhancedRiskFactors {
  const ipReputation = ip.startsWith("10.") || ip.startsWith("192.168.") ? 0 : 
    (ip.split('.').reduce((a, b) => a + parseInt(b), 0) % 20);
  
  let impossibleTravel = 0;
  if (lastLoginTime && lastLoginGeo && currentGeo) {
    const lastTime = new Date(lastLoginTime).getTime();
    const now = Date.now();
    const hoursSinceLastLogin = (now - lastTime) / (1000 * 60 * 60);
    if (lastLoginGeo !== currentGeo && hoursSinceLastLogin < 2) {
      impossibleTravel = 25;
    } else if (lastLoginGeo !== currentGeo && hoursSinceLastLogin < 6) {
      impossibleTravel = 15;
    }
  }
  
  const velocityScore = lastLoginTime ? 
    (Date.now() - new Date(lastLoginTime).getTime() < 60000 ? 15 : 0) : 0;
  
  let browserPatternScore = 0;
  if (fingerprint) {
    if (!fingerprint.cookiesEnabled) browserPatternScore += 5;
    if (fingerprint.timezone === "undefined") browserPatternScore += 5;
    if (!fingerprint.webglRenderer) browserPatternScore += 5;
  }
  
  let botLikelihoodScore = 0;
  if (typingMetrics) {
    if (typingMetrics.avgKeyDownTime < 20 || typingMetrics.avgKeyDownTime > 500) botLikelihoodScore += 10;
    if (typingMetrics.typingSpeed > 200) botLikelihoodScore += 10;
  }
  
  const behavioralScore = typingMetrics ? 
    Math.min(15, Math.abs(typingMetrics.typingSpeed - 45) / 3) : 0;

  return {
    ipReputation: Math.min(20, ipReputation),
    impossibleTravel: Math.min(25, impossibleTravel),
    velocityScore: Math.min(15, velocityScore),
    browserPatternScore: Math.min(15, browserPatternScore),
    botLikelihoodScore: Math.min(20, botLikelihoodScore),
    behavioralScore: Math.min(15, Math.round(behavioralScore)),
  };
}

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

function getHiddenReason(breakdown: RiskBreakdown, enhanced?: EnhancedRiskFactors): string {
  if (enhanced) {
    if (enhanced.impossibleTravel >= 15) return hiddenFraudReasons.impossible_travel;
    if (enhanced.botLikelihoodScore >= 10) return hiddenFraudReasons.bot_detected;
    if (enhanced.ipReputation >= 15) return hiddenFraudReasons.ip_blacklisted;
    if (enhanced.velocityScore >= 10) return hiddenFraudReasons.high_velocity;
    if (enhanced.browserPatternScore >= 10) return hiddenFraudReasons.browser_anomaly;
  }
  if (breakdown.deviceDrift >= 20) return hiddenFraudReasons.device_mismatch;
  if (breakdown.geoDrift >= 15) return hiddenFraudReasons.geo_mismatch;
  if (breakdown.typingDrift >= 15) return hiddenFraudReasons.typing_anomaly;
  if (breakdown.timingAnomaly >= 5) return hiddenFraudReasons.time_anomaly;
  return hiddenFraudReasons.normal;
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
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const parseResult = loginRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid login data" });
      }

      const { username, password, fingerprint, typingMetrics, loginSource } = parseResult.data;
      const user = await storage.getAuthUser(username);

      const clientIp = req.ip || req.socket.remoteAddress || "0.0.0.0";
      const userAgent = req.headers["user-agent"] || "Unknown";
      const device = userAgent.includes("Chrome") ? "Chrome" : 
                     userAgent.includes("Firefox") ? "Firefox" : 
                     userAgent.includes("Safari") ? "Safari" : "Unknown";
      const deviceType = userAgent.includes("Mobile") ? "mobile" : "desktop";
      const geo = "US East";
      const region = "us-east";

      const baseline = user ? {
        primaryDevice: user.primaryDevice,
        primaryRegion: user.primaryRegion,
        avgTypingSpeed: user.avgTypingSpeed,
        typicalLoginWindow: user.typicalLoginWindow,
      } : undefined;

      const breakdown = calculateRiskBreakdown(
        { 
          device: `${deviceType === 'mobile' ? 'Mobile' : 'Desktop'} - ${device}`,
          deviceType,
          geo,
          region,
          typingSpeed: typingMetrics?.typingSpeed || 45,
          loginAttempts: 1,
          loginTime: new Date().getHours(),
        },
        baseline
      );

      const enhancedFactors = calculateEnhancedRiskFactors(
        clientIp,
        user?.lastLoginIp,
        user?.lastLoginTime,
        user?.lastLoginGeo,
        geo,
        typingMetrics,
        fingerprint
      );

      const baseScore = breakdown.deviceDrift + breakdown.geoDrift + breakdown.typingDrift + 
                       breakdown.timingAnomaly + breakdown.attemptsMultiplier;
      const enhancedScore = enhancedFactors.ipReputation + enhancedFactors.impossibleTravel + 
                           enhancedFactors.velocityScore + enhancedFactors.browserPatternScore + 
                           enhancedFactors.botLikelihoodScore + enhancedFactors.behavioralScore;
      const riskScore = Math.min(100, baseScore + Math.floor(enhancedScore / 2));
      
      const rules = await storage.getRules();
      const riskLevel = getRiskLevel(riskScore);
      const decision = getDecision(riskScore, rules);
      const hiddenReason = getHiddenReason(breakdown, enhancedFactors);

      const loginAttempt: LoginAttempt = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        userId: user?.id,
        username,
        ip: clientIp,
        device: `${deviceType === 'mobile' ? 'Mobile' : 'Desktop'} - ${device}`,
        deviceType,
        geo,
        region,
        fingerprint,
        riskScore,
        riskLevel,
        decision,
        breakdown,
        enhancedFactors,
        reason: generateExplanation(breakdown, riskScore, decision),
        success: false,
        requiresOtp: decision === "challenge",
        loginSource,
        hiddenReason,
      };

      if (!user || user.password !== password) {
        loginAttempt.success = false;
        await storage.addLoginAttempt(loginAttempt);
        return res.status(401).json({ 
          error: "Invalid credentials",
          message: "Username or password is incorrect"
        });
      }

      if (decision === "block") {
        loginAttempt.success = false;
        await storage.addLoginAttempt(loginAttempt);
        return res.status(403).json({ 
          error: "Access denied",
          message: "Your login attempt has been blocked for security reasons. Please contact support."
        });
      }

      if (decision === "challenge") {
        const otpSession = await storage.createOtpSession(user.id);
        req.session.otpSessionId = otpSession.id;
        req.session.pendingLogin = true;
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        
        loginAttempt.requiresOtp = true;
        await storage.addLoginAttempt(loginAttempt);
        
        return res.json({ 
          requiresOtp: true,
          otpSessionId: otpSession.id,
          message: "Additional verification required. Please enter the OTP code."
        });
      }

      loginAttempt.success = true;
      await storage.addLoginAttempt(loginAttempt);
      
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      req.session.pendingLogin = false;

      res.json({ 
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { code } = req.body;
      const sessionId = req.session.otpSessionId;

      if (!sessionId) {
        return res.status(400).json({ error: "No OTP session found" });
      }

      const verified = await storage.verifyOtp(sessionId, code);
      
      if (!verified) {
        return res.status(401).json({ error: "Invalid or expired OTP code" });
      }

      req.session.pendingLogin = false;
      const user = await storage.getAuthUserById(req.session.userId!);

      res.json({ 
        success: true,
        user: user ? {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        } : null
      });
    } catch (error) {
      res.status(500).json({ error: "OTP verification failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId || req.session.pendingLogin) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await storage.getAuthUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  });

  // Real production login - silent fraud detection, no risk data exposed
  app.post("/api/auth/real-login", async (req, res) => {
    try {
      const { email, password, fingerprint, typingMetrics } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Find user by email (using username field for simplicity)
      const user = await storage.getAuthUser(email.split('@')[0]) || await storage.getAuthUser(email);
      
      const clientIp = req.ip || req.socket.remoteAddress || "0.0.0.0";
      const userAgent = req.headers["user-agent"] || "Unknown";
      const device = userAgent.includes("Chrome") ? "Chrome" : 
                     userAgent.includes("Firefox") ? "Firefox" : 
                     userAgent.includes("Safari") ? "Safari" : "Unknown";
      const deviceType = userAgent.includes("Mobile") ? "mobile" : "desktop";
      const geo = "US East";
      const region = "us-east";

      const baseline = user ? {
        primaryDevice: user.primaryDevice,
        primaryRegion: user.primaryRegion,
        avgTypingSpeed: user.avgTypingSpeed,
        typicalLoginWindow: user.typicalLoginWindow,
      } : undefined;

      const breakdown = calculateRiskBreakdown(
        { 
          device: `${deviceType === 'mobile' ? 'Mobile' : 'Desktop'} - ${device}`,
          deviceType,
          geo,
          region,
          typingSpeed: typingMetrics?.typingSpeed || 45,
          loginAttempts: 1,
          loginTime: new Date().getHours(),
        },
        baseline
      );

      const enhancedFactors = calculateEnhancedRiskFactors(
        clientIp,
        user?.lastLoginIp,
        user?.lastLoginTime,
        user?.lastLoginGeo,
        geo,
        typingMetrics,
        fingerprint
      );

      // Get AI model prediction
      const trainingFeatures = extractTrainingFeatures(
        typingMetrics || { typingSpeed: 45 },
        fingerprint,
        null,
        geo,
        user?.lastLoginGeo || null,
        1,
        user?.password === password
      );
      
      const aiPrediction = fraudModel.predict(trainingFeatures);

      // Calculate combined risk score including AI model
      const baseScore = breakdown.deviceDrift + breakdown.geoDrift + breakdown.typingDrift + 
                       breakdown.timingAnomaly + breakdown.attemptsMultiplier;
      const enhancedScore = enhancedFactors.ipReputation + enhancedFactors.impossibleTravel + 
                           enhancedFactors.velocityScore + enhancedFactors.browserPatternScore + 
                           enhancedFactors.botLikelihoodScore + enhancedFactors.behavioralScore;
      const aiScore = aiPrediction.score * 0.3; // Weight AI score at 30%
      const riskScore = Math.min(100, baseScore + Math.floor(enhancedScore / 2) + Math.floor(aiScore));
      
      const rules = await storage.getRules();
      const riskLevel = getRiskLevel(riskScore);
      const decision = getDecision(riskScore, rules);
      const hiddenReason = getHiddenReason(breakdown, enhancedFactors);

      // Log the attempt with AI model score
      const loginAttempt: LoginAttempt = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        userId: user?.id,
        username: email,
        ip: clientIp,
        device: `${deviceType === 'mobile' ? 'Mobile' : 'Desktop'} - ${device}`,
        deviceType,
        geo,
        region,
        fingerprint,
        riskScore,
        riskLevel,
        decision,
        breakdown,
        enhancedFactors: {
          ...enhancedFactors,
          aiModelAnomalyScore: aiPrediction.score,
        },
        reason: generateExplanation(breakdown, riskScore, decision),
        success: false,
        requiresOtp: false,
        loginSource: "real-login",
        hiddenReason: `${hiddenReason} | AI Score: ${aiPrediction.score}`,
      };

      // Train the model with this sample
      fraudModel.addSample(trainingFeatures, decision === "block" || decision === "challenge");

      // Silent failure for invalid credentials
      if (!user || user.password !== password) {
        loginAttempt.success = false;
        await storage.addLoginAttempt(loginAttempt);
        return res.status(401).json({ error: "Invalid login" });
      }

      // Silent failure for blocked/challenged attempts
      if (decision === "block" || decision === "challenge") {
        loginAttempt.success = false;
        await storage.addLoginAttempt(loginAttempt);
        return res.status(401).json({ error: "Invalid login" });
      }

      // Success - allow or alert
      loginAttempt.success = true;
      await storage.addLoginAttempt(loginAttempt);
      
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      req.session.pendingLogin = false;

      // Return only success - NO risk data
      res.json({ success: true });
    } catch (error) {
      console.error("Real login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Login Simulation endpoint - evaluates risk but does NOT create sessions
  // This is for testing/training purposes only
  app.post("/api/simulate-login", async (req, res) => {
    try {
      const { username, password, fingerprint, typingMetrics } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required", success: false });
      }

      // Find user
      const user = await storage.getAuthUser(username);
      
      const clientIp = req.ip || req.socket.remoteAddress || "0.0.0.0";
      const userAgent = req.headers["user-agent"] || "Unknown";
      const device = userAgent.includes("Chrome") ? "Chrome" : 
                     userAgent.includes("Firefox") ? "Firefox" : 
                     userAgent.includes("Safari") ? "Safari" : "Unknown";
      const deviceType = userAgent.includes("Mobile") ? "mobile" : "desktop";
      
      // Improved geo detection - default to user's baseline if available for simulation
      const tzLower = (fingerprint?.timezone || "").toLowerCase();
      let geo = "US East"; // Default for simulation
      if (tzLower.includes("asia")) geo = "Asia";
      else if (tzLower.includes("europe") || tzLower.includes("london") || tzLower.includes("paris") || tzLower.includes("berlin")) geo = "EU";
      else if (tzLower.includes("america") || tzLower.includes("us/") || tzLower.includes("new_york") || tzLower.includes("los_angeles") || tzLower.includes("chicago")) geo = "US East";
      else if (user?.primaryRegion) geo = user.primaryRegion.includes("us") ? "US East" : user.primaryRegion;
      
      const region = geo.toLowerCase().replace(" ", "-");

      const baseline = user ? {
        primaryDevice: user.primaryDevice,
        primaryRegion: user.primaryRegion,
        avgTypingSpeed: user.avgTypingSpeed,
        typicalLoginWindow: user.typicalLoginWindow,
      } : undefined;

      const breakdown = calculateRiskBreakdown(
        { 
          device: `${deviceType === 'mobile' ? 'Mobile' : 'Desktop'} - ${device}`,
          deviceType,
          geo,
          region,
          typingSpeed: typingMetrics?.typingSpeed || 45,
          loginAttempts: 1,
          loginTime: new Date().getHours(),
        },
        baseline
      );

      const enhancedFactors = calculateEnhancedRiskFactors(
        clientIp,
        user?.lastLoginIp,
        user?.lastLoginTime,
        user?.lastLoginGeo,
        geo,
        typingMetrics,
        fingerprint
      );

      // Get AI model prediction
      const trainingFeatures = extractTrainingFeatures(
        typingMetrics || { typingSpeed: 45 },
        fingerprint,
        null,
        geo,
        user?.lastLoginGeo || null,
        1,
        user?.password === password
      );
      
      const aiPrediction = fraudModel.predict(trainingFeatures);

      // Calculate combined risk score
      const baseScore = breakdown.deviceDrift + breakdown.geoDrift + breakdown.typingDrift + 
                       breakdown.timingAnomaly + breakdown.attemptsMultiplier;
      const enhancedScore = enhancedFactors.ipReputation + enhancedFactors.impossibleTravel + 
                           enhancedFactors.velocityScore + enhancedFactors.browserPatternScore + 
                           enhancedFactors.botLikelihoodScore + enhancedFactors.behavioralScore;
      const aiScore = aiPrediction.score * 0.3;
      const riskScore = Math.min(100, baseScore + Math.floor(enhancedScore / 2) + Math.floor(aiScore));
      
      const rules = await storage.getRules();
      const riskLevel = getRiskLevel(riskScore);
      const decision = getDecision(riskScore, rules);
      const hiddenReason = getHiddenReason(breakdown, enhancedFactors);

      // Check credentials
      const credentialsValid = user && user.password === password;

      console.log(`[Simulation] User: ${username}, Valid: ${credentialsValid}, Risk: ${riskScore}, Decision: ${decision}, Geo: ${geo}`);

      // For simulation mode: success is based on credentials only
      // Risk data is still logged for ML training purposes
      const simulationSuccess = credentialsValid;

      // Log the simulation attempt with full metadata for ML training
      const simulationAttempt: LoginAttempt = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        userId: user?.id,
        username,
        ip: clientIp,
        device: `${deviceType === 'mobile' ? 'Mobile' : 'Desktop'} - ${device}`,
        deviceType,
        geo,
        region,
        fingerprint,
        riskScore,
        riskLevel,
        decision,
        breakdown,
        enhancedFactors: {
          ...enhancedFactors,
          aiModelAnomalyScore: aiPrediction.score,
        },
        reason: generateExplanation(breakdown, riskScore, decision),
        success: simulationSuccess,
        requiresOtp: false,
        loginSource: "simulation",
        hiddenReason: `${hiddenReason} | AI Score: ${aiPrediction.score} | Simulation Mode`,
      };

      await storage.addLoginAttempt(simulationAttempt);

      // Train the model with this sample
      fraudModel.addSample(trainingFeatures, decision === "block" || decision === "challenge");

      // Return success/failure based on credentials only
      // Risk data is logged but doesn't block simulation
      return res.json({ success: simulationSuccess });
    } catch (error) {
      console.error("Simulation error:", error);
      res.status(500).json({ error: "Simulation failed", success: false });
    }
  });

  // Real Login - forwards to ALL systems (SIEM, Event Logs, Audit, etc.)
  // This endpoint processes ANY input and triggers the full fraud pipeline
  app.post("/api/real-login", async (req, res) => {
    try {
      const { username, password, fingerprint, typingMetrics, pageLoadTime, submitTimestamp } = req.body;
      
      // Process even empty/invalid inputs - trigger full pipeline
      const usernameValue = username || "anonymous";
      const passwordValue = password || "";
      
      const user = await storage.getAuthUser(usernameValue);
      
      const clientIp = req.ip || req.socket.remoteAddress || "0.0.0.0";
      const userAgent = req.headers["user-agent"] || "Unknown";
      const device = userAgent.includes("Chrome") ? "Chrome" : 
                     userAgent.includes("Firefox") ? "Firefox" : 
                     userAgent.includes("Safari") ? "Safari" : "Unknown";
      const deviceType = userAgent.includes("Mobile") ? "mobile" : "desktop";
      
      // Geo detection from fingerprint
      const tzLower = (fingerprint?.timezone || "").toLowerCase();
      let geo = "Unknown";
      if (tzLower.includes("asia")) geo = "Asia";
      else if (tzLower.includes("europe") || tzLower.includes("london") || tzLower.includes("paris")) geo = "EU";
      else if (tzLower.includes("america") || tzLower.includes("new_york") || tzLower.includes("los_angeles")) geo = "US East";
      else if (user?.primaryRegion) geo = user.primaryRegion;
      
      const region = geo.toLowerCase().replace(" ", "-");

      const baseline = user ? {
        primaryDevice: user.primaryDevice,
        primaryRegion: user.primaryRegion,
        avgTypingSpeed: user.avgTypingSpeed,
        typicalLoginWindow: user.typicalLoginWindow,
      } : undefined;

      // Calculate full risk breakdown
      const breakdown = calculateRiskBreakdown(
        { 
          device: `${deviceType === 'mobile' ? 'Mobile' : 'Desktop'} - ${device}`,
          deviceType,
          geo,
          region,
          typingSpeed: typingMetrics?.typingSpeed || 0,
          loginAttempts: 1,
          loginTime: new Date().getHours(),
        },
        baseline
      );

      const enhancedFactors = calculateEnhancedRiskFactors(
        clientIp,
        user?.lastLoginIp,
        user?.lastLoginTime,
        user?.lastLoginGeo,
        geo,
        typingMetrics,
        fingerprint
      );

      // Get AI model prediction
      const trainingFeatures = extractTrainingFeatures(
        typingMetrics || { typingSpeed: 0 },
        fingerprint,
        null,
        geo,
        user?.lastLoginGeo || null,
        1,
        user?.password === passwordValue
      );
      
      const aiPrediction = fraudModel.predict(trainingFeatures);

      // Calculate combined risk score
      const baseScore = breakdown.deviceDrift + breakdown.geoDrift + breakdown.typingDrift + 
                       breakdown.timingAnomaly + breakdown.attemptsMultiplier;
      const enhancedScore = enhancedFactors.ipReputation + enhancedFactors.impossibleTravel + 
                           enhancedFactors.velocityScore + enhancedFactors.browserPatternScore + 
                           enhancedFactors.botLikelihoodScore + enhancedFactors.behavioralScore;
      const aiScore = aiPrediction.score * 0.3;
      const riskScore = Math.min(100, baseScore + Math.floor(enhancedScore / 2) + Math.floor(aiScore));
      
      const rules = await storage.getRules();
      const riskLevel = getRiskLevel(riskScore);
      const decision = getDecision(riskScore, rules);
      const hiddenReason = getHiddenReason(breakdown, enhancedFactors);

      // Check credentials
      // For external simulation: accept if credentials valid AND not blocked
      // (allow, alert, and challenge all pass - only "block" fails)
      const credentialsValid = !!(user && user.password === passwordValue);
      const loginSuccess = credentialsValid && decision !== "block";

      // Create comprehensive login attempt record
      const externalAttempt: LoginAttempt = {
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        userId: user?.id,
        username: usernameValue,
        ip: clientIp,
        device: `${deviceType === 'mobile' ? 'Mobile' : 'Desktop'} - ${device}`,
        deviceType,
        geo,
        region,
        fingerprint,
        riskScore,
        riskLevel,
        decision,
        breakdown,
        enhancedFactors: {
          ...enhancedFactors,
          aiModelAnomalyScore: aiPrediction.score,
        },
        reason: generateExplanation(breakdown, riskScore, decision),
        success: loginSuccess,
        requiresOtp: false,
        loginSource: "real-login",
        hiddenReason: `${hiddenReason} | AI: ${aiPrediction.score.toFixed(1)} | PageLoad: ${pageLoadTime}ms`,
      };

      // Store in main login attempts
      await storage.addLoginAttempt(externalAttempt);

      // Train the model with this sample
      fraudModel.addSample(trainingFeatures, decision === "block" || decision === "challenge");

      // Fan out to all monitoring systems (SIEM, Event Logs, Audit, WebSocket, Local Log)
      await fanOutLoginAttempt(externalAttempt);

      console.log(`[RealLogin] User: ${usernameValue}, Risk: ${riskScore}, Decision: ${decision}, Success: ${loginSuccess}`);

      // Return ONLY success/failure - NO risk data exposed
      return res.json({ success: loginSuccess });
    } catch (error) {
      console.error("External login error:", error);
      res.status(500).json({ success: false });
    }
  });

  // AI Model endpoints (admin only)
  app.get("/api/admin/model/status", async (req, res) => {
    if (!req.session.userId || req.session.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const state = fraudModel.getModelState();
    res.json({
      modelId: state.id,
      version: state.version,
      isReady: state.isReady,
      trainedAt: state.trainedAt,
      samplesCount: state.samplesCount,
      metrics: state.metrics,
    });
  });

  app.post("/api/admin/model/retrain", async (req, res) => {
    if (!req.session.userId || req.session.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    fraudModel.forceRetrain();
    const state = fraudModel.getModelState();
    res.json({
      success: true,
      message: "Model retrained successfully",
      modelId: state.id,
      version: state.version,
      metrics: state.metrics,
    });
  });

  app.get("/api/admin/model/export", async (req, res) => {
    if (!req.session.userId || req.session.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const modelData = fraudModel.exportModel();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=fraud-model.json');
    res.send(modelData);
  });

  // Model prediction endpoint - allows testing the model
  app.post("/api/model/predict", async (req, res) => {
    try {
      const {
        typingSpeed,
        keystrokeCount,
        totalTypingTime,
        hourOfDay,
        dayOfWeek,
        deviceConsistency,
        geoDistance,
        attemptCount,
        fingerprintStability,
        passwordCorrect,
      } = req.body;

      const features = {
        typingSpeed: typingSpeed ?? 50,
        keystrokeCount: keystrokeCount ?? 25,
        totalTypingTime: totalTypingTime ?? 5000,
        hourOfDay: hourOfDay ?? 14,
        dayOfWeek: dayOfWeek ?? 2,
        deviceConsistency: deviceConsistency ?? 0.9,
        geoDistance: geoDistance ?? 50,
        attemptCount: attemptCount ?? 1,
        fingerprintStability: fingerprintStability ?? 0.85,
        passwordCorrect: passwordCorrect ?? 1,
      };

      const prediction = fraudModel.predict(features);
      const rules = await storage.getRules();
      
      // Calculate risk level and decision based on the score
      const riskLevel = getRiskLevel(prediction.score);
      const decision = getDecision(prediction.score, rules);

      // Calculate feature breakdown scores
      const modelState = fraudModel.getModelState();
      const breakdown = {
        typingScore: Math.round(Math.max(0, Math.min(100, 
          Math.abs(features.typingSpeed - 55) / 55 * 100
        ))),
        deviceScore: Math.round((1 - features.deviceConsistency) * 100),
        geoScore: Math.round(Math.min(100, features.geoDistance / 50)),
        timeScore: Math.round(
          (features.hourOfDay < 6 || features.hourOfDay > 22) ? 70 : 
          (features.hourOfDay < 8 || features.hourOfDay > 18) ? 30 : 10
        ),
        velocityScore: Math.round(Math.min(100, (features.attemptCount - 1) * 20)),
      };

      res.json({
        isAnomaly: prediction.isAnomaly,
        score: prediction.score,
        confidence: prediction.confidence,
        riskLevel,
        decision,
        breakdown,
      });
    } catch (error) {
      console.error("Model prediction error:", error);
      res.status(500).json({ error: "Prediction failed" });
    }
  });

  app.get("/api/admin/login-attempts", async (req, res) => {
    if (!req.session.userId || req.session.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const attempts = await storage.getLoginAttempts();
    res.json(attempts);
  });

  app.get("/api/admin/fraud-rules", async (req, res) => {
    if (!req.session.userId || req.session.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    res.json({
      rules: hiddenFraudReasons,
      thresholds: {
        ipReputation: { max: 20, triggerAt: 15 },
        impossibleTravel: { max: 25, triggerAt: 15 },
        velocityScore: { max: 15, triggerAt: 10 },
        browserPatternScore: { max: 15, triggerAt: 10 },
        botLikelihoodScore: { max: 20, triggerAt: 10 },
        behavioralScore: { max: 15, triggerAt: 10 },
      }
    });
  });

  app.get("/api/dashboard", async (req, res) => {
    try {
      // Check if user is logged in
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const stats = await storage.getDashboardStats();
      
      // Admin sees all data, regular user sees only their own data
      if (req.session.role === "admin") {
        res.json(stats);
      } else {
        // Filter for user's own data only
        const userId = req.session.userId;
        const userLogs = stats.recentEvents.filter((log: any) => log.userId === userId);
        const userRiskyEntry = stats.topRiskyUsers.find((u: any) => u.id === userId);
        
        // Calculate user-specific stats
        const userHighRisk = userLogs.filter((l: any) => l.riskLevel === "high" || l.riskLevel === "critical").length;
        const userMedium = userLogs.filter((l: any) => l.riskLevel === "medium").length;
        const userLow = userLogs.filter((l: any) => l.riskLevel === "low").length;
        const userSafe = userLogs.filter((l: any) => l.riskLevel === "safe").length;
        
        res.json({
          totalEvents: userLogs.length,
          highRiskPercentage: userLogs.length > 0 ? Math.round((userHighRisk / userLogs.length) * 100) : 0,
          blockedCount: userLogs.filter((l: any) => l.decision === "block").length,
          avgResponseTime: stats.avgResponseTime,
          riskDistribution: {
            critical: userLogs.filter((l: any) => l.riskLevel === "critical").length,
            high: userHighRisk,
            medium: userMedium,
            low: userLow,
            safe: userSafe,
          },
          deviceStats: stats.deviceStats,
          geoStats: stats.geoStats,
          topRiskyUsers: userRiskyEntry ? [userRiskyEntry] : [],
          recentEvents: userLogs.slice(0, 20),
          hourlyTrend: stats.hourlyTrend,
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/logs", async (req, res) => {
    try {
      // Check if user is logged in
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const logs = await storage.getLogs();
      
      // Admin sees all logs, regular user sees only their own logs
      if (req.session.role === "admin") {
        res.json(logs);
      } else {
        const userId = req.session.userId;
        const userLogs = logs.filter((log: any) => log.userId === userId);
        res.json(userLogs);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      // Check if user is logged in
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const users = await storage.getUsers();
      
      // Admin sees all data, regular users see limited data
      if (req.session.role === "admin") {
        res.json(users);
      } else {
        // Regular users see basic user info without sensitive fraud data
        const safeUsers = users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          riskScore: user.riskScore,
          status: user.status,
          lastLogin: user.lastLogin,
          totalLogins: user.totalLogins,
          primaryDevice: user.primaryDevice,
          primaryRegion: user.primaryRegion,
        }));
        res.json(safeUsers);
      }
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
      // Filter out sensitive fraud data - only return safe info for regular users
      const safeLogins = logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        device: log.device,
        geo: log.geo,
        decision: log.decision === "allow" || log.decision === "challenge" ? "allow" : log.decision,
        success: log.success,
        // All fraud-related fields are hidden from users
      }));
      res.json(safeLogins);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risk history" });
    }
  });

  app.get("/api/rules", async (req, res) => {
    try {
      // Only admins can access fraud detection rules
      if (req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const rules = await storage.getRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rules" });
    }
  });

  app.put("/api/rules", async (req, res) => {
    try {
      // Only admins can modify fraud detection rules
      if (req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
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
