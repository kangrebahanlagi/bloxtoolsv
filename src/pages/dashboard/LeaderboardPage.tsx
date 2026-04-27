import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Trophy, Medal } from 'lucide-react';
import type { DashboardProfile } from './DashboardLayout';
import { getRank } from '@/config/toolsConfig';

interface Row {
  id: string;
  username: string;
  hit_count: number;
  total_robux: number;
  total_rap: number;
}

const LeaderboardPage = () => {
  const { profile } = useOutletContext<{ profile: DashboardProfile }>();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);

  const load = React.useCallback(async () => {
    const top = await (supabase as any)
      .from('leaderboard')
      .select('id, username, hit_count, total_robux, total_rap')
      .order('hit_count', { ascending: false })
      .limit(50);
    if (top.error) {
      toast.error(top.error.message);
      setRows([]);
      return;
    }
    const list = (top.data ?? []) as Row[];
    setRows(list);

    const meIdx = list.findIndex((r) => r.id === profile.id);
    if (meIdx >= 0) {
      setMyRank(meIdx + 1);
    } else {
      const me = await (supabase as any)
        .from('leaderboard')
        .select('hit_count')
        .eq('id', profile.id)
        .maybeSingle();
      if (me.data) {
        const above = await (supabase as any)
          .from('leaderboard')
          .select('id', { count: 'exact', head: true })
          .gt('hit_count', me.data.hit_count);
        setMyRank((above.count ?? 0) + 1);
      }
    }
  }, [profile.id]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('leaderboard-hits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hits' }, () => {
        load();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  useEffect(() => {
    // legacy block kept empty to preserve structure
    return;
    (async () => {
      // Top 50 by hits
      const top = await (supabase as any)
        .from('leaderboard')
        .select('id, username, hit_count, total_robux, total_rap')
        .order('hit_count', { ascending: false })
        .limit(50);
      if (top.error) {
        toast.error(top.error.message);
        setRows([]);
        return;
      }
      const list = (top.data ?? []) as Row[];
      setRows(list);

      // Compute current user position globally (count of users above me)
      const meIdx = list.findIndex((r) => r.id === profile.id);
      if (meIdx >= 0) {
        setMyRank(meIdx + 1);
      } else {
        const me = await (supabase as any)
          .from('leaderboard')
          .select('hit_count')
          .eq('id', profile.id)
          .maybeSingle();
        if (me.data) {
          const above = await (supabase as any)
            .from('leaderboard')
            .select('id', { count: 'exact', head: true })
            .gt('hit_count', me.data.hit_count);
          setMyRank((above.count ?? 0) + 1);
        }
      }
    })();
  }, [profile.id]);

  if (rows === null) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blox-teal" />
      </div>
    );
  }

  const medal = (i: number) => {
    if (i === 0) return <Trophy className="h-5 w-5 text-yellow-400" />;
    if (i === 1) return <Medal className="h-5 w-5 text-gray-300" />;
    if (i === 2) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-gray-500 w-5 text-center text-sm">{i + 1}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="blox-card p-5">
        <div className="text-sm text-gray-400">Your global position</div>
        <div className="text-2xl font-bold text-blox-teal">
          {myRank ? `#${myRank}` : 'Unranked'}
        </div>
      </div>

      <h2 className="text-lg font-semibold">Top 50 Beamers</h2>

      <div className="blox-card divide-y divide-white/5 overflow-hidden">
        {rows.length === 0 && (
          <div className="p-6 text-center text-gray-400">No data yet.</div>
        )}
        {rows.map((r, i) => {
          const rank = getRank(r.hit_count);
          const isMe = r.id === profile.id;
          return (
            <div
              key={r.id}
              className={`flex items-center gap-3 p-3 ${isMe ? 'bg-blox-teal/10' : ''}`}
            >
              <div className="w-6 flex justify-center">{medal(i)}</div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold truncate ${isMe ? 'text-blox-teal' : ''}`}>
                  @{r.username} {isMe && <span className="text-xs text-gray-400">(you)</span>}
                </div>
                <div className="text-xs text-gray-400">{rank.current.name}</div>
              </div>
              <div className="text-right text-sm">
                <div className="font-bold">{r.hit_count} hits</div>
                <div className="text-xs text-gray-400">{r.total_robux.toLocaleString()} R$ · {r.total_rap.toLocaleString()} RAP</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeaderboardPage;
