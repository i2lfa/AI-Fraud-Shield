import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/logs" component={EventLogs} />
      <Route path="/simulator" component={RiskSimulator} />
      <Route path="/users" component={UserProfiles} />
      <Route path="/users/:id" component={UserDetail} />
      <Route path="/analysis" component={BehaviorAnalysis} />
      <Route path="/rules" component={SecurityRules} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-14 items-center justify-between gap-4 border-b bg-card px-4">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto bg-background">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
