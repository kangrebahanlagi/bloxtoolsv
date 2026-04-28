import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp, Coins, Calculator, DollarSign } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { DashboardProfile } from './DashboardLayout';

interface HitRow {
  id: string;
  roblox_robux: number | null;
  roblox_rap: number | null;
  roblox_gamepass_earnings: number | null;
  roblox_robux_spent: number | null;
  roblox_pending_robux: number | null;
  roblox_incoming_robux: number | null;
  roblox_summary: number | null;
  roblox_premium: boolean | null;
  created_at: string;
}

// Roblox DevEx rate: 100,000 R$ = $350 USD → 1 R$ ≈ $0.0035
const USD_PER_ROBUX = 0.0035;
// RAP is illiquid — apply a discount
const RAP_LIQUIDITY = 0.7;

const InfoPage = () => {
  const { profile } = useOutletContext<{ profile: DashboardProfile }>();
  const [hits, setHits] = useState<HitRow[] | null>(null);
  const [days, setDays] = useState<7 | 30 | 90>(30);

  useEffect(() => {
    supabase
      .from('hits')
      .select('id, roblox_robux, roblox_rap, roblox_gamepass_earnings, roblox_robux_spent, roblox_pending_robux, roblox_incoming_robux, roblox_summary, roblox_premium, created_at')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: true })
      .limit(2000)
      .then(({ data }) => setHits((data as HitRow[]) ?? []));
  }, [profile.id]);

  const totals = useMemo(() => {
    if (!hits) return null;
    let robux = 0, rap = 0, gamepass = 0, spent = 0, pending = 0, incoming = 0, summary = 0, premium = 0;
    for (const h of hits) {
      robux += h.roblox_robux ?? 0;
      rap += h.roblox_rap ?? 0;
      gamepass += h.roblox_gamepass_earnings ?? 0;
      spent += h.roblox_robux_spent ?? 0;
      pending += h.roblox_pending_robux ?? 0;
      incoming += h.roblox_incoming_robux ?? 0;
      summary += h.roblox_summary ?? 0;
      if (h.roblox_premium) premium++;
    }
    const liquidRobux = robux + gamepass;
    const rapValue = Math.floor(rap * RAP_LIQUIDITY);
    const totalRobux = liquidRobux + rapValue;
    return {
      hits: hits.length,
      robux, rap, gamepass, spent, pending, incoming, summary, premium,
      liquidRobux,
      rapValue,
      totalRobux,
      usdLiquid: liquidRobux * USD_PER_ROBUX,
      usdRap: rapValue * USD_PER_ROBUX,
      usdTotal: totalRobux * USD_PER_ROBUX,
      avgPerHit: hits.length ? totalRobux / hits.length : 0,
    };
  }, [hits]);

  const chartData = useMemo(() => {
    if (!hits) return [];
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const buckets = new Map<string, { date: string; hits: number; robux: number; rap: number }>();
    for (const h of hits) {
      const t = new Date(h.created_at).getTime();
      if (t < cutoff) continue;
      const key = new Date(h.created_at).toISOString().slice(0, 10);
      const bucket = buckets.get(key) ?? { date: key, hits: 0, robux: 0, rap: 0 };
      bucket.hits += 1;
      bucket.robux += h.roblox_robux ?? 0;
      bucket.rap += h.roblox_rap ?? 0;
      buckets.set(key, bucket);
    }
    // Fill missing days with zeros
    const out: Array<{ date: string; hits: number; robux: number; rap: number; label: string }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const b = buckets.get(key) ?? { date: key, hits: 0, robux: 0, rap: 0 };
      out.push({ ...b, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) });
    }
    return out;
  }, [hits, days]);

  if (!hits || !totals) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blox-teal" />
      </div>
    );
  }

  const Stat = ({ label, value, sub, icon }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: React.ReactNode }) => (
    <div className="blox-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase text-gray-400">
        {icon}{label}
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Other Statistics — quick aggregate panel */}
      <div className="blox-card p-5">
        <div className="text-sm font-semibold text-gray-300 mb-4">Other Statistics</div>
        <div className="divide-y divide-white/5">
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-400">Total RAP</span>
            <span className="font-mono">{totals.rap.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-400">Total Robux</span>
            <span className="font-mono">{totals.robux.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-400">Pending Robux</span>
            <span className="font-mono text-yellow-300">{totals.pending.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-400">Incoming (Past Year)</span>
            <span className="font-mono text-green-300">{totals.incoming.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-400">Summary (Past Year)</span>
            <span className="font-mono">{totals.summary.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-400">Premium Accounts</span>
            <span className="font-mono">{totals.premium}</span>
          </div>
        </div>
      </div>

      {/* Hit Value Calculator */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blox-teal" />
          Hit Value Calculator
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat
            label="Liquid Robux"
            value={totals.liquidRobux.toLocaleString()}
            sub={<>Robux + Gamepass earnings</>}
            icon={<Coins className="h-3 w-3" />}
          />
          <Stat
            label="RAP Value"
            value={totals.rapValue.toLocaleString()}
            sub={<>{totals.rap.toLocaleString()} RAP × {Math.round(RAP_LIQUIDITY * 100)}% liquidity</>}
          />
          <Stat
            label="Total Est. Value"
            value={`${totals.totalRobux.toLocaleString()} R$`}
            sub={<>Across {totals.hits} hit{totals.hits === 1 ? '' : 's'}</>}
          />
          <Stat
            label="Estimated USD"
            value={`$${totals.usdTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
            sub={<>@ DevEx rate (1 R$ ≈ ${USD_PER_ROBUX})</>}
            icon={<DollarSign className="h-3 w-3" />}
          />
        </div>

        <div className="blox-card p-4 mt-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-400 uppercase">Avg per hit</div>
              <div className="text-lg font-semibold">
                {Math.round(totals.avgPerHit).toLocaleString()} R$
                <span className="text-gray-500 text-sm"> · ${(totals.avgPerHit * USD_PER_ROBUX).toFixed(2)}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase">Lifetime spent</div>
              <div className="text-lg font-semibold text-red-300">{totals.spent.toLocaleString()} R$</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase">Net (earned − spent)</div>
              <div className={`text-lg font-semibold ${totals.totalRobux - totals.spent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {(totals.totalRobux - totals.spent).toLocaleString()} R$
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Estimates are based on Roblox's current Developer Exchange rate (~$350 per 100k R$). RAP is discounted to {Math.round(RAP_LIQUIDITY * 100)}% because limited items are illiquid.
          </p>
        </div>
      </div>

      {/* Hit Timeline Chart */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blox-teal" />
            Hit Timeline
          </h2>
          <div className="flex gap-1">
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 rounded text-xs font-medium ${days === d ? 'bg-blox-teal/20 text-blox-teal' : 'bg-black/30 text-gray-400 hover:text-gray-200'}`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        <div className="blox-card p-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="hitsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} stroke="rgba(255,255,255,0.1)" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#121212', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8 }}
                  labelStyle={{ color: '#a855f7' }}
                />
                <Area type="monotone" dataKey="hits" stroke="#a855f7" strokeWidth={2} fill="url(#hitsGrad)" name="Hits" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InfoPage;
