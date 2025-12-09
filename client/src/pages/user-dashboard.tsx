import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  User, 
  Shield, 
  Clock, 
  MapPin, 
  Monitor, 
  LogOut,
  CheckCircle,
  Activity,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

export default function UserDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading: userLoading, error } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
  });

  const { data: baseline } = useQuery({
    queryKey: ["/api/user", user?.id, "baseline"],
    enabled: !!user?.id,
  });

  const { data: history } = useQuery({
    queryKey: ["/api/user", user?.id, "risk-history"],
    enabled: !!user?.id,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/login");
      toast({
        title: "Logged Out",
        description: "You have been securely logged out.",
      });
    },
  });

  if (error) {
    setLocation("/login");
    return null;
  }

  if (userLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  const recentLogins = (history as any[])?.slice(0, 5) || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-user-welcome">
            Welcome, {user?.username}
          </h1>
          <p className="text-muted-foreground mt-1">
            Your account is protected by AI Fraud Shield
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <Shield className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle className="w-5 h-5 text-chart-2" />
              <span className="text-lg font-semibold text-chart-2">Protected</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Real-time fraud detection is active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primary Device</CardTitle>
            <Monitor className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold" data-testid="text-primary-device">
              {(baseline as any)?.primaryDevice || "Not set"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Your recognized device
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primary Region</CardTitle>
            <MapPin className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold" data-testid="text-primary-region">
              {(baseline as any)?.primaryRegion || "Not set"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Your usual login location
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Username</span>
              <span className="font-medium">{user?.username}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Account Type</span>
              <Badge variant="secondary">{user?.role}</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Typical Login Window</span>
              <span className="font-medium">
                {(baseline as any)?.typicalLoginWindow?.start || 8}:00 - {(baseline as any)?.typicalLoginWindow?.end || 18}:00
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Login Activity
            </CardTitle>
            <CardDescription>Your last 5 login sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLogins.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentLogins.map((login: any) => (
                  <div
                    key={login.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                    data-testid={`row-login-${login.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{login.device}</p>
                        <p className="text-xs text-muted-foreground">
                          {login.geo}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(login.timestamp), "MMM d, h:mm a")}
                      </p>
                      <Badge 
                        variant={login.decision === "allow" ? "secondary" : "outline"}
                        className="text-xs mt-1"
                      >
                        {login.decision === "allow" ? "Successful" : "Verified"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Security Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Use Trusted Devices</h4>
              <p className="text-sm text-muted-foreground">
                Logging in from your usual device helps us verify your identity quickly.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Consistent Location</h4>
              <p className="text-sm text-muted-foreground">
                Login from familiar locations to avoid additional verification steps.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Report Suspicious Activity</h4>
              <p className="text-sm text-muted-foreground">
                If you notice unfamiliar logins, contact support immediately.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
