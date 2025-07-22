import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import ClubDashboard from "@/pages/club-dashboard";
import JoinClub from "@/pages/join-club";
import ExploreClubs from "@/pages/explore-clubs";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/join/:inviteCode" component={JoinClub} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/explore" component={ExploreClubs} />
          <Route path="/club/:id" component={ClubDashboard} />
          <Route path="/join/:inviteCode" component={JoinClub} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
