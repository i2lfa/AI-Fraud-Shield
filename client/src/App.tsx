import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import EventLogs from "@/pages/event-logs";
import RiskSimulator from "@/pages/risk-simulator";
import UserProfiles from "@/pages/user-profiles";
import UserDetail from "@/pages/user-detail";
import BehaviorAnalysis from "@/pages/behavior-analysis";
import SecurityRules from "@/pages/security-rules";
import Login from "@/pages/login";
import UserDashboard from "@/pages/user-dashboard";
import AdminPanel from "@/pages/admin-panel";

function PublicRoutes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route component={Login} />
    </Switch>
  );
}

function ProtectedRoutes() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/logs" component={EventLogs} />
      <Route path="/simulator" component={RiskSimulator} />
      <Route path="/users" component={UserProfiles} />
      <Route path="/users/:id" component={UserDetail} />
      <Route path="/analysis" component={BehaviorAnalysis} />
      <Route path="/rules" component={SecurityRules} />
      <Route path="/user-dashboard" component={UserDashboard} />
      <Route path="/admin" component={AdminPanel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  
  const isPublicRoute = location === "/login" || location === "/side-login";
  
  if (isPublicRoute) {
    return <PublicRoutes />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center justify-between gap-4 border-b bg-card px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <ProtectedRoutes />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
