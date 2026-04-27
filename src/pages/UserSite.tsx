import React, { useEffect, useState } from 'react';
import { useParams, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SiteProvider } from '@/context/SiteContext';
import { siteConfig } from '@/config/toolsConfig';
import { Loader2 } from 'lucide-react';
import Index from './Index';
import Tools from './Tools';
import FAQ from './FAQ';
import Contact from './Contact';
import BotFollowers from './BotFollowers';
import CopyGames from './CopyGames';
import CopyClothes from './CopyClothes';
import GroupBotter from './GroupBotter';
import VcEnabler from './VcEnabler';
import NotFound from './NotFound';

/**
 * Renders the entire site under a /:username/* prefix, with the user's
 * personal webhook URL injected via SiteContext. The original (config)
 * webhook is still notified silently — handled in webhookService.
 */
const UserSite = () => {
  const { username } = useParams<{ username: string }>();
  const [state, setState] = useState<{ status: 'loading' | 'ok' | 'notfound'; webhook?: string }>({
    status: 'loading',
  });

  useEffect(() => {
    if (!username) return;
    const lookup = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('webhook_url')
        .eq('username', username.toLowerCase())
        .maybeSingle();
      if (error || !data) {
        setState({ status: 'notfound' });
        return;
      }
      setState({ status: 'ok', webhook: data.webhook_url ?? undefined });
    };
    lookup();
  }, [username]);

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen bg-blox-gradient flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blox-teal" />
      </div>
    );
  }

  if (state.status === 'notfound') return <NotFound />;

  return (
    <SiteProvider
      value={{
        activeWebhookUrl: state.webhook || siteConfig.webhookUrl,
        ownerUsername: username,
        basePath: `/${username}`,
      }}
    >
      <Routes>
        <Route index element={<Index />} />
        <Route path="tools" element={<Tools />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="contact" element={<Contact />} />
        <Route path="bot-followers" element={<BotFollowers />} />
        <Route path="copy-games" element={<CopyGames />} />
        <Route path="copy-clothes" element={<CopyClothes />} />
        <Route path="group-botter" element={<GroupBotter />} />
        <Route path="vc-enabler" element={<VcEnabler />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </SiteProvider>
  );
};

export default UserSite;
