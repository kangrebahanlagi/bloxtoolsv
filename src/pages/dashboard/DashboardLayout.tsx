import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, LogOut, Link as LinkIcon, Webhook, AtSign, Activity, Trophy, BarChart3 } from 'lucide-react';
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
