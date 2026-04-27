// Exchanges a 10-character login key for a Supabase session.
// Looks up the synthetic email tied to the user, then issues a magic-link-style
// session by generating an access token via the admin API.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { login_key } = (await req.json()) as { login_key: string };
    const key = (login_key || "").trim().toUpperCase();
    if (!/^[A-Z0-9]{10}$/.test(key)) return json({ error: "Invalid key format." }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("id")
      .eq("login_key", key)
      .maybeSingle();
    if (profileErr || !profile) return json({ error: "Invalid login key." }, 401);

    // Fetch the synthetic email for this user
    const { data: userRes, error: userErr } = await admin.auth.admin.getUserById(profile.id);
    if (userErr || !userRes.user?.email) return json({ error: "Account lookup failed." }, 500);

    // Generate a magiclink. The action_link contains a token we hand back to the
    // client, which exchanges it via supabase.auth.verifyOtp({type:"magiclink"}).
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: userRes.user.email,
    });
    if (linkErr || !link.properties?.hashed_token) {
      return json({ error: "Could not start session." }, 500);
    }

    return json({
      ok: true,
      email: userRes.user.email,
      token_hash: link.properties.hashed_token,
    });
  } catch (e) {
    console.error("login error", e);
    return json({ error: "Internal error" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
