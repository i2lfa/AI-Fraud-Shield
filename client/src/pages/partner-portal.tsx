import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Building2, 
  Key, 
  RefreshCw, 
  Copy, 
  Check,
  Eye,
  EyeOff,
  Shield,
  Activity,
  Ban,
  CheckCircle,
  Clock,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface Partner {
  id: string;
  name: string;
  clientId: string;
  isActive: boolean;
  rateLimitPerMinute: number;
  totalRequests: number;
  blockedRequests: number;
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface NewCredentials {
  clientId: string;
  clientSecret: string;
  warning: string;
}

const createPartnerSchema = z.object({
  name: z.string().min(1, "Partner name is required"),
  webhookUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export default function PartnerPortal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showSecret, setShowSecret] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newCredentials, setNewCredentials] = useState<NewCredentials | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: user, isLoading: userLoading, error } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
  });

  const { data: partners, isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ["/api/admin/partners"],
    enabled: user?.role === "admin",
  });

  const form = useForm({
    resolver: zodResolver(createPartnerSchema),
    defaultValues: {
      name: "",
      webhookUrl: "",
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: async (data: { name: string; webhookUrl?: string }) => {
      const response = await apiRequest("POST", "/api/admin/partners", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      setNewCredentials(data.credentials);
      setCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Partner Created",
        description: "Store the client secret securely - it won't be shown again.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to create partner",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const rotateSecretMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      const response = await apiRequest("POST", `/api/admin/partners/${partnerId}/rotate-secret`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      setNewCredentials(data.credentials);
      toast({
        title: "Secret Rotated",
        description: "Store the new client secret securely.",
      });
    },
  });

  const togglePartnerMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/partners/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      toast({
        title: "Partner Updated",
        description: "Partner status has been updated.",
      });
    },
  });

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    if (error || (user && user.role !== "admin")) {
      setLocation("/login");
    }
  }, [error, user, setLocation]);

  if (error || (user && user.role !== "admin")) {
    return null;
  }

  if (userLoading || partnersLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const totalRequests = partners?.reduce((sum, p) => sum + p.totalRequests, 0) || 0;
  const totalBlocked = partners?.reduce((sum, p) => sum + p.blockedRequests, 0) || 0;
  const activePartners = partners?.filter(p => p.isActive).length || 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            Partner Portal
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage partner integrations and API credentials
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-partner">
              <Plus className="h-4 w-4 mr-2" />
              Add Partner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Partner</DialogTitle>
              <DialogDescription>
                Create API credentials for a new partner company.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createPartnerMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partner Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Acme Corporation" 
                          data-testid="input-partner-name"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="webhookUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Webhook URL (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://partner.com/webhook" 
                          data-testid="input-webhook-url"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createPartnerMutation.isPending}
                    data-testid="button-submit-partner"
                  >
                    {createPartnerMutation.isPending ? "Creating..." : "Create Partner"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {newCredentials && (
        <Card className="border-2 border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              New API Credentials
            </CardTitle>
            <CardDescription className="text-destructive font-medium">
              {newCredentials.warning}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="w-24 text-muted-foreground">Client ID:</Label>
              <code className="flex-1 bg-muted px-2 py-1 rounded text-sm font-mono">
                {newCredentials.clientId}
              </code>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => copyToClipboard(newCredentials.clientId, "new-id")}
                data-testid="button-copy-new-client-id"
              >
                {copiedId === "new-id" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-24 text-muted-foreground">Secret:</Label>
              <code className="flex-1 bg-muted px-2 py-1 rounded text-sm font-mono">
                {showSecret === "new" ? newCredentials.clientSecret : "sk_" + "●".repeat(40)}
              </code>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowSecret(showSecret === "new" ? null : "new")}
                data-testid="button-toggle-secret-visibility"
              >
                {showSecret === "new" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => copyToClipboard(newCredentials.clientSecret, "new-secret")}
                data-testid="button-copy-new-secret"
              >
                {copiedId === "new-secret" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setNewCredentials(null)}
              className="mt-2"
              data-testid="button-dismiss-credentials"
            >
              I've saved these credentials
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-partners">
              {activePartners}
            </div>
            <p className="text-xs text-muted-foreground">
              of {partners?.length || 0} total partners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-requests">
              {totalRequests.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              across all partners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Requests</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-blocked-requests">
              {totalBlocked.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalRequests > 0 ? Math.round((totalBlocked / totalRequests) * 100) : 0}% block rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Partner Companies</CardTitle>
          <CardDescription>
            Manage API access for partner integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {partners && partners.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {partners.map((partner) => (
                  <Card key={partner.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold" data-testid={`text-partner-name-${partner.id}`}>
                              {partner.name}
                            </h3>
                            <Badge variant={partner.isActive ? "default" : "secondary"}>
                              {partner.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Key className="h-3 w-3" />
                            <code className="font-mono">{partner.clientId}</code>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(partner.clientId, partner.id)}
                              data-testid={`button-copy-client-id-${partner.id}`}
                            >
                              {copiedId === partner.id ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rotateSecretMutation.mutate(partner.id)}
                            disabled={rotateSecretMutation.isPending}
                            data-testid={`button-rotate-secret-${partner.id}`}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Rotate Secret
                          </Button>
                          <Button
                            size="sm"
                            variant={partner.isActive ? "secondary" : "default"}
                            onClick={() => togglePartnerMutation.mutate({ 
                              id: partner.id, 
                              isActive: !partner.isActive 
                            })}
                            disabled={togglePartnerMutation.isPending}
                            data-testid={`button-toggle-partner-${partner.id}`}
                          >
                            {partner.isActive ? (
                              <>
                                <ToggleRight className="h-4 w-4 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-4 w-4 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Requests</span>
                          <p className="font-medium" data-testid={`text-requests-${partner.id}`}>
                            {partner.totalRequests.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Blocked</span>
                          <p className="font-medium text-destructive" data-testid={`text-blocked-${partner.id}`}>
                            {partner.blockedRequests.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rate Limit</span>
                          <p className="font-medium">{partner.rateLimitPerMinute}/min</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created</span>
                          <p className="font-medium">
                            {format(new Date(partner.createdAt), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No partners registered yet.</p>
              <p className="text-sm">Click "Add Partner" to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>
            Partner API endpoints and usage examples
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Authentication</h4>
            <p className="text-sm text-muted-foreground">
              Use HTTP Basic Authentication with your Client ID and Client Secret:
            </p>
            <pre className="bg-muted p-3 rounded text-sm font-mono overflow-x-auto">
              Authorization: Basic base64(client_id:client_secret)
            </pre>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">POST /partner/api/analyze</h4>
            <p className="text-sm text-muted-foreground">
              Analyze login behavior and get fraud risk assessment:
            </p>
            <pre className="bg-muted p-3 rounded text-sm font-mono overflow-x-auto">
{`{
  "userIdentifier": "user@example.com",
  "fingerprint": {
    "userAgent": "Mozilla/5.0...",
    "screenResolution": "1920x1080",
    "timezone": "America/New_York"
  },
  "typingMetrics": {
    "avgKeyDownTime": 80,
    "avgKeyUpTime": 40,
    "typingSpeed": 45
  },
  "ipAddress": "192.168.1.1"
}`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Response</h4>
            <pre className="bg-muted p-3 rounded text-sm font-mono overflow-x-auto">
{`{
  "sessionId": "sess_abc123",
  "riskScore": 35,
  "riskLevel": "low",
  "decision": "allow",
  "confidence": 80,
  "factors": {
    "deviceRisk": 5,
    "behaviorRisk": 10,
    "geoRisk": 15,
    "velocityRisk": 5
  },
  "recommendation": "Allow the login to proceed."
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
