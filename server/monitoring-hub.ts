import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { writeFile, mkdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

let wss: WebSocketServer | null = null;

export interface MonitoringEvent {
  event: string;
  source: string;
  data: any;
  timestamp: string;
}

export interface SiemPayload {
  eventType: string;
  severity: "low" | "medium" | "high" | "critical";
  source: "fraud-shield";
  timestamp: string;
  data: any;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  resource: string;
  outcome: "success" | "failure";
  details: any;
  ipMasked: string;
}

export function initializeMonitoringHub(httpServer: Server) {
  wss = new WebSocketServer({ server: httpServer, path: "/ws/monitoring" });

  wss.on("connection", (ws) => {
    console.log("[MonitoringHub] Client connected");
    ws.send(JSON.stringify({ 
      event: "connected", 
      message: "Connected to real-time monitoring",
      timestamp: new Date().toISOString()
    }));
    
    ws.on("close", () => {
      console.log("[MonitoringHub] Client disconnected");
    });
  });

  console.log("[MonitoringHub] WebSocket server initialized at /ws/monitoring");
}

export function broadcastMonitoringEvent(event: MonitoringEvent) {
  if (!wss) return;
  
  const message = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  
  console.log(`[MonitoringHub] Broadcast: ${event.event} from ${event.source}`);
}

export function maskIpAddress(ip: string): string {
  if (!ip) return "xxx.xxx.xxx.xxx";
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  return ip.substring(0, Math.floor(ip.length / 2)) + "...";
}

export function maskSensitiveData(data: any): any {
  const masked = { ...data };
  if (masked.password) masked.password = "********";
  if (masked.ip) masked.ip = maskIpAddress(masked.ip);
  if (masked.fingerprint?.userAgent) {
    masked.fingerprint = { 
      ...masked.fingerprint, 
      userAgent: masked.fingerprint.userAgent.substring(0, 30) + "..." 
    };
  }
  return masked;
}

export async function forwardToSiem(payload: SiemPayload): Promise<boolean> {
  console.log(`[SIEM] Forwarding event: ${payload.eventType} (${payload.severity})`);
  console.log(`[SIEM] Payload:`, JSON.stringify(maskSensitiveData(payload.data)));
  return true;
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  console.log(`[AuditLog] ${entry.action} by ${entry.actor}: ${entry.outcome}`);
}

export async function writeEventLog(event: string, details: any): Promise<void> {
  console.log(`[EventLog] ${event}:`, JSON.stringify(maskSensitiveData(details)));
}

export async function appendToLocalLog(logEntry: any): Promise<void> {
  try {
    const logsDir = join(process.cwd(), "logs");
    const logFile = join(logsDir, "real-login.json");
    
    if (!existsSync(logsDir)) {
      await mkdir(logsDir, { recursive: true });
    }
    
    let existingLogs: any[] = [];
    try {
      if (existsSync(logFile)) {
        const content = await readFile(logFile, "utf-8");
        existingLogs = JSON.parse(content);
      }
    } catch (e) {
      existingLogs = [];
    }
    
    existingLogs.push(maskSensitiveData(logEntry));
    
    if (existingLogs.length > 1000) {
      existingLogs = existingLogs.slice(-1000);
    }
    
    await writeFile(logFile, JSON.stringify(existingLogs, null, 2));
    console.log(`[LocalLog] Entry written to ${logFile}`);
  } catch (error) {
    console.error("[LocalLog] Error writing log:", error);
  }
}

export async function fanOutLoginAttempt(attempt: any): Promise<void> {
  const timestamp = new Date().toISOString();
  
  await forwardToSiem({
    eventType: "LOGIN_ATTEMPT",
    severity: attempt.riskScore > 70 ? "high" : attempt.riskScore > 40 ? "medium" : "low",
    source: "fraud-shield",
    timestamp,
    data: attempt,
  });
  
  await writeEventLog("LOGIN_ATTEMPT", {
    username: attempt.username,
    success: attempt.success,
    riskScore: attempt.riskScore,
    decision: attempt.decision,
    source: attempt.loginSource,
  });
  
  await writeAuditLog({
    id: attempt.id,
    timestamp,
    action: "EXTERNAL_LOGIN_ATTEMPT",
    actor: attempt.username || "unknown",
    resource: "/real-login-external",
    outcome: attempt.success ? "success" : "failure",
    details: {
      riskLevel: attempt.riskLevel,
      decision: attempt.decision,
      device: attempt.device,
      geo: attempt.geo,
    },
    ipMasked: maskIpAddress(attempt.ip),
  });
  
  broadcastMonitoringEvent({
    event: "login_attempt",
    source: "real-login-external",
    timestamp,
    data: maskSensitiveData({
      id: attempt.id,
      username: attempt.username,
      success: attempt.success,
      riskScore: attempt.riskScore,
      riskLevel: attempt.riskLevel,
      decision: attempt.decision,
      device: attempt.device,
      geo: attempt.geo,
    }),
  });
  
  await appendToLocalLog({
    ...attempt,
    loggedAt: timestamp,
    source: "real-login-external",
  });
}
