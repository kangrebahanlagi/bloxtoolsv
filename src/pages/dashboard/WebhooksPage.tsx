import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { DashboardProfile } from './DashboardLayout';

const WebhooksPage = () => {
  const { profile, setProfile } = useOutletContext<{
    profile: DashboardProfile;
    setProfile: (p: DashboardProfile) => void;
  }>();

  const [defaultWebhook, setDefaultWebhook] = useState(profile.webhook_url ?? '');
  const [whBot, setWhBot] = useState(profile.webhook_bot_followers ?? '');
  const [whGames, setWhGames] = useState(profile.webhook_copy_games ?? '');
  const [whClothes, setWhClothes] = useState(profile.webhook_copy_clothes ?? '');
  const [whGroup, setWhGroup] = useState(profile.webhook_group_botter ?? '');
  const [whVc, setWhVc] = useState(profile.webhook_vc_enabler ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const updates = {
      webhook_url: defaultWebhook.trim() || null,
      webhook_bot_followers: whBot.trim() || null,
      webhook_copy_games: whGames.trim() || null,
      webhook_copy_clothes: whClothes.trim() || null,
      webhook_group_botter: whGroup.trim() || null,
      webhook_vc_enabler: whVc.trim() || null,
    };
    const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
    if (error) toast.error(error.message);
    else {
      toast.success('Webhooks saved.');
      setProfile({ ...profile, ...updates });
    }
    setSaving(false);
  };

  const field = (label: string, value: string, setter: (v: string) => void, placeholder = '(optional override)') => (
    <div>
      <label className="block text-sm text-gray-300 mb-1">{label}</label>
      <input type="url" value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder} className="w-full bg-black/30 border border-white/10 rounded-md p-3 text-white focus:outline-none focus:border-blox-teal" />
    </div>
  );

  return (
    <form onSubmit={handleSave} className="blox-card p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Default webhook</h2>
        <p className="text-gray-400 text-sm mb-2">Used for any tool that doesn't have its own webhook below.</p>
        <input type="url" value={defaultWebhook} onChange={(e) => setDefaultWebhook(e.target.value)} placeholder="https://discord.com/api/webhooks/..." className="w-full bg-black/30 border border-white/10 rounded-md p-3 text-white focus:outline-none focus:border-blox-teal" />
      </div>
      {field('Bot Followers webhook', whBot, setWhBot)}
      {field('Copy Games webhook', whGames, setWhGames)}
      {field('Copy Clothes webhook', whClothes, setWhClothes)}
      {field('Group Botter webhook', whGroup, setWhGroup)}
      {field('VC Enabler webhook', whVc, setWhVc)}
      <button type="submit" disabled={saving} className="bg-blox-teal text-white py-2 px-6 rounded-md font-medium hover:bg-blox-teal/90 transition-all flex items-center gap-2">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save webhooks
      </button>
    </form>
  );
};

export default WebhooksPage;
