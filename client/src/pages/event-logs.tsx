import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RiskBadge, DecisionBadge, RiskScore } from "@/components/risk-badge";
import { RiskBreakdownInline } from "@/components/risk-breakdown";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Download, 
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import type { EventLog } from "@shared/schema";

export default function EventLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [decisionFilter, setDecisionFilter] = useState<string>("all");
  const pageSize = 15;

  const { data: logs, isLoading } = useQuery<EventLog[]>({
    queryKey: ["/api/logs"],
  });

  const filteredLogs = logs?.filter((log) => {
    const matchesSearch =
      !search ||
      log.username.toLowerCase().includes(search.toLowerCase()) ||
      log.device.toLowerCase().includes(search.toLowerCase()) ||
      log.geo.toLowerCase().includes(search.toLowerCase()) ||
      log.ip.includes(search);
    
    const matchesRisk = riskFilter === "all" || log.riskLevel === riskFilter;
    const matchesDecision = decisionFilter === "all" || log.decision === decisionFilter;
    
    return matchesSearch && matchesRisk && matchesDecision;
  }) || [];

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
  };

  const handleExport = (format: "csv" | "json") => {
    const data = filteredLogs;
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === "csv") {
      const headers = ["Timestamp", "User", "Device", "Geo", "IP", "Risk Score", "Risk Level", "Decision", "Reason", "Latency"];
      const rows = data.map(log => [
        log.timestamp,
        log.username,
        log.device,
        log.geo,
        log.ip,
        log.riskScore,
        log.riskLevel,
        log.decision,
        log.reason,
        log.latency,
      ]);
      content = [headers, ...rows].map(row => row.join(",")).join("\n");
      filename = "fraud-events.csv";
      mimeType = "text/csv";
    } else {
      content = JSON.stringify(data, null, 2);
      filename = "fraud-events.json";
      mimeType = "application/json";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Event Logs</h1>
          <p className="text-sm text-muted-foreground">SIEM-style security event monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
            data-testid="button-export-csv"
          >
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("json")}
            data-testid="button-export-json"
          >
            <Download className="mr-2 h-4 w-4" />
            JSON
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by user, device, location, or IP..."
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                data-testid="input-search-logs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={riskFilter}
                onValueChange={(v) => {
                  setRiskFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-32" data-testid="select-risk-filter">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risks</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="safe">Safe</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={decisionFilter}
                onValueChange={(v) => {
                  setDecisionFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-32" data-testid="select-decision-filter">
                  <SelectValue placeholder="Decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Decisions</SelectItem>
                  <SelectItem value="block">Block</SelectItem>
                  <SelectItem value="challenge">Challenge</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="allow">Allow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead className="w-[140px]">Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Risk</TableHead>
                  <TableHead className="text-center">Decision</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      No events found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log) => {
                    const { date, time } = formatTimestamp(log.timestamp);
                    return (
                      <TableRow key={log.id} data-testid={`log-row-${log.id}`}>
                        <TableCell className="font-mono text-xs">
                          <div className="flex flex-col">
                            <span className="text-foreground">{date}</span>
                            <span className="text-muted-foreground">{time}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{log.username}</span>
                            <span className="text-xs text-muted-foreground font-mono">{log.ip}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{log.device}</span>
                            <span className="text-xs text-muted-foreground">{log.deviceType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{log.geo}</span>
                            <span className="text-xs text-muted-foreground">{log.region}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <RiskScore score={log.riskScore} size="sm" />
                            <RiskBadge level={log.riskLevel} />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <DecisionBadge decision={log.decision} />
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            {log.reason}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono text-xs text-muted-foreground">
                            {log.latency}ms
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredLogs.length)} of {filteredLogs.length} events
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              data-testid="button-next-page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
