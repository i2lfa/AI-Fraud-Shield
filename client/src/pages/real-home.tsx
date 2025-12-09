import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, LogOut, Shield, CheckCircle } from "lucide-react";

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

export default function RealHome() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading, error } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/real-login");
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    },
  });

  useEffect(() => {
    if (error) {
      setLocation("/real-login");
    }
  }, [error, setLocation]);

  if (error) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-20 rounded-full mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = user?.username
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 text-chart-2 mb-4">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Securely Signed In</span>
          </div>
          <CardTitle className="text-2xl" data-testid="text-welcome">
            Welcome back, {user?.username}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center space-y-1">
              <p className="text-lg font-medium" data-testid="text-username">
                {user?.username}
              </p>
              <p className="text-sm text-muted-foreground" data-testid="text-email">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Account Protected</p>
                <p className="text-xs text-muted-foreground">
                  Your session is secure and encrypted
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
