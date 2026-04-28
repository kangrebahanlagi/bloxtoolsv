import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, LogOut, Link as LinkIcon, Webhook, AtSign, Activity, Trophy, BarChart3, MessageSquare } from 'lucide-react';
import { siteConfig } from '@/config/toolsConfig';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import Logo from '@/components/Logo';

export interface DashboardProfile {
  id: string;
  username: string;
  webhook_url: string | null;
  webhook_bot_followers: string | null;
  webhook_copy_games: string | null;
  webhook_copy_clothes: string | null;
  webhook_group_botter: string | null;
  webhook_vc_enabler: string | null;
}

interface OutletCtx {
  profile: DashboardProfile;
  setProfile: (p: DashboardProfile) => void;
}

const items = [
  { to: '/dashboard/info', end: false, label: 'Info', icon: BarChart3 },
  { to: '/dashboard', end: true, label: 'Site URL', icon: LinkIcon },
  { to: '/dashboard/webhooks', end: false, label: 'Webhooks', icon: Webhook },
  { to: '/dashboard/subdomain', end: false, label: 'Subdomain', icon: AtSign },
  { to: '/dashboard/hits', end: false, label: 'Hits', icon: Activity },
  { to: '/dashboard/leaderboard', end: false, label: 'Leaderboard', icon: Trophy },
  { to: '/dashboard/chat', end: false, label: 'Global Chat', icon: MessageSquare },
];

const DashboardLayout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DashboardProfile | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate('/login', { replace: true });
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, webhook_url, webhook_bot_followers, webhook_copy_games, webhook_copy_clothes, webhook_group_botter, webhook_vc_enabler')
        .eq('id', sess.session.user.id)
        .maybeSingle();
      if (error) toast.error(error.message);
      if (data) setProfile(data as DashboardProfile);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-blox-gradient flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blox-teal" />
      </div>
    );
  }

  const ctx: OutletCtx = { profile, setProfile };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-blox-gradient">
        <Sidebar collapsible="icon">
          <SidebarContent className="bg-black/40 border-r border-white/5">
            <div className="p-4 border-b border-white/5">
              <Logo />
            </div>
            <SidebarGroup>
              <SidebarGroupLabel>Manage</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) =>
                            `flex items-center gap-2 ${isActive ? 'bg-blox-teal/20 text-blox-teal font-medium' : 'hover:bg-white/5'}`
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a
                        href={siteConfig.discordInviteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-[#5865F2]/15 text-[#a5acff] hover:bg-[#5865F2]/25 hover:text-white"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                          <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3a13.7 13.7 0 0 0-.617 1.27 18.27 18.27 0 0 0-5.487 0A13.3 13.3 0 0 0 9.83 3a19.74 19.74 0 0 0-3.76 1.37C2.4 9.59 1.4 14.69 1.9 19.71a19.93 19.93 0 0 0 6.04 3.06c.49-.66.92-1.37 1.29-2.11-.71-.27-1.39-.6-2.04-.99.17-.13.34-.26.5-.4 3.93 1.84 8.18 1.84 12.06 0 .17.14.33.27.5.4-.65.39-1.34.72-2.05.99.37.74.8 1.45 1.29 2.11a19.9 19.9 0 0 0 6.04-3.06c.59-5.83-1-10.88-4.21-15.34zM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.09 2.16 2.42 0 1.34-.96 2.42-2.16 2.42zm7.96 0c-1.18 0-2.16-1.08-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.09 2.16 2.42 0 1.34-.95 2.42-2.16 2.42z"/>
                        </svg>
                        <span>Discord Server</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleSignOut}>
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-white/5 bg-black/20 px-4 gap-3">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Dashboard</h1>
            <div className="ml-auto text-sm text-gray-400">
              Signed in as <span className="text-blox-teal">@{profile.username}</span>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-3xl mx-auto">
              <Outlet context={ctx} />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
