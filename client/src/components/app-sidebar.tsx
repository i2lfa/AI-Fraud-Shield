import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  FileText, 
  Activity,
  User,
  Settings,
  Zap,
  LogOut,
  Lock,
  Home,
  Brain,
} from "lucide-react";
import logoImage from "@assets/logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
}

const mainItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Event Logs",
    url: "/logs",
    icon: FileText,
  },
  {
    title: "Risk Simulator",
    url: "/simulator",
    icon: Zap,
  },
];

const adminOnlyItems = [
  {
    title: "AI Model Playground",
    url: "/model-playground",
    icon: Brain,
  },
  {
    title: "Security Rules",
    url: "/rules",
    icon: Settings,
  },
];

const analysisItems = [
  {
    title: "User Profiles",
    url: "/users",
    icon: User,
  },
  {
    title: "Behavior Analysis",
    url: "/analysis",
    icon: Activity,
  },
];


export function AppSidebar() {
  const [location, setLocation] = useLocation();

  const { data: user } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/login");
    },
  });

  const isActive = (url: string) => {
    if (url === "/") return location === "/";
    return location.startsWith(url);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 p-1">
            <img src={logoImage} alt="AI Fraud Shield" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-sidebar-foreground tracking-tight">AI Fraud Shield</span>
            <span className="text-xs text-muted-foreground">Security Platform</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {user && (
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/user-dashboard")}>
                    <Link href="/user-dashboard" data-testid="link-nav-my-dashboard">
                      <Home className="h-4 w-4" />
                      <span>My Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {user.role === "admin" && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin")}>
                      <Link href="/admin" data-testid="link-nav-admin-panel">
                        <Lock className="h-4 w-4" />
                        <span>Admin Panel</span>
                        <Badge variant="destructive" className="ml-auto text-xs">Secret</Badge>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Analysis</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analysisItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {user?.role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin Only</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminOnlyItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(' ', '-')}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-3">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-md bg-sidebar-accent p-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user.username}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-sidebar-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Button 
            variant="default" 
            size="sm" 
            className="w-full"
            onClick={() => setLocation("/login")}
            data-testid="button-sidebar-login"
          >
            Sign In
          </Button>
        )}
        <div className="flex items-center gap-2 rounded-md bg-sidebar-accent p-3">
          <div className="h-2 w-2 rounded-full bg-risk-low animate-pulse" />
          <span className="text-xs text-muted-foreground">System Active</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
