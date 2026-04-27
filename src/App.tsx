
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SiteProvider } from "@/context/SiteContext";
import { siteConfig } from "@/config/toolsConfig";
import Index from "./pages/Index";
import Tools from "./pages/Tools";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import BotFollowers from "./pages/BotFollowers";
import CopyGames from "./pages/CopyGames";
import CopyClothes from "./pages/CopyClothes";
import GroupBotter from "./pages/GroupBotter";
import VcEnabler from "./pages/VcEnabler";
import Login from "./pages/Login";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import SiteUrlPage from "./pages/dashboard/SiteUrlPage";
import WebhooksPage from "./pages/dashboard/WebhooksPage";
import SubdomainPage from "./pages/dashboard/SubdomainPage";
import HitsPage from "./pages/dashboard/HitsPage";
import LeaderboardPage from "./pages/dashboard/LeaderboardPage";
import UserSite from "./pages/UserSite";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Reserved top-level paths that must NOT be treated as usernames.
const RESERVED = new Set([
  "tools", "faq", "contact", "bot-followers", "copy-games", "copy-clothes",
  "group-botter", "vc-enabler",
  "login", "signup", "dashboard", "leaderboard", "assets", "api", "favicon.png", "robots.txt",
]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-blox-gradient">
          <SiteProvider value={{ activeWebhookUrl: siteConfig.webhookUrl, basePath: "" }}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/bot-followers" element={<BotFollowers />} />
              <Route path="/copy-games" element={<CopyGames />} />
              <Route path="/copy-clothes" element={<CopyClothes />} />
              <Route path="/group-botter" element={<GroupBotter />} />
              <Route path="/vc-enabler" element={<VcEnabler />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Login />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<SiteUrlPage />} />
                <Route path="webhooks" element={<WebhooksPage />} />
                <Route path="subdomain" element={<SubdomainPage />} />
                <Route path="hits" element={<HitsPage />} />
                <Route path="leaderboard" element={<LeaderboardPage />} />
              </Route>
              {/* Per-user site lives at /:username/* */}
              <Route
                path="/:username/*"
                element={<UserSiteGuarded reserved={RESERVED} />}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SiteProvider>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Guards the /:username/* route so that reserved words fall through to NotFound.
import { useParams } from "react-router-dom";
const UserSiteGuarded = ({ reserved }: { reserved: Set<string> }) => {
  const { username } = useParams();
  if (!username || reserved.has(username.toLowerCase())) return <NotFound />;
  return <UserSite />;
};

export default App;
