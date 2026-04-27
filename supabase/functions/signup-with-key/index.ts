// Creates a new user with a username + a webhook to deliver the login key to.
// No password / no email is collected from the user. We synthesize an internal
// email so Supabase auth can store the user, but it is never shown.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";

interface Body {
  username: string;
  webhook_url: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { username, webhook_url } = (await req.json()) as Body;
    const cleanUsername = (username || "").trim().toLowerCase();
    const cleanWebhook = (webhook_url || "").trim();

    if (!/^[a-z0-9_-]{3,30}$/.test(cleanUsername)) {
      return json({ error: "Username must be 3–30 chars: a–z, 0–9, hyphen, underscore." }, 400);
    }
    if (!/^https:\/\/(discord|discordapp)\.com\/api\/webhooks\//.test(cleanWebhook)) {
      return json({ error: "Webhook must be a Discord webhook URL." }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Reject reserved usernames up front (clearer error than the trigger)
    const { data: reserved } = await admin
      .from("reserved_usernames")
      .select("name")
      .eq("name", cleanUsername)
      .maybeSingle();
    if (reserved) return json({ error: "That username is reserved." }, 400);

    // Reject taken usernames
    const { data: taken } = await admin
      .from("profiles")
      .select("id")
      .eq("username", cleanUsername)
      .maybeSingle();
    if (taken) return json({ error: "That username is already taken." }, 400);

    // Internal synthetic email + random password. The user never sees these.
    const synthEmail = `${cleanUsername}-${crypto.randomUUID()}@users.local`;
    const synthPassword = crypto.randomUUID() + crypto.randomUUID();

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: synthEmail,
      password: synthPassword,
      email_confirm: true,
      user_metadata: {
        username: cleanUsername,
        signup_webhook_url: cleanWebhook,
      },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message || "Failed to create account" }, 400);
    }

    // The trigger generated the login key. Read it back.
    const { data: profile } = await admin
      .from("profiles")
      .select("login_key, username")
      .eq("id", created.user.id)
      .maybeSingle();

    if (!profile?.login_key) {
      return json({ error: "Account created but no key generated." }, 500);
    }

    // Also store the webhook as the user's default tool webhook
    await admin
      .from("profiles")
      .update({ webhook_url: cleanWebhook })
      .eq("id", created.user.id);

    // Deliver the login key to the user's webhook
    await fetch(cleanWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: "Your account has been created.",
        embeds: [
          {
            title: "Login key",
            description:
              "**This is the ONLY way to sign in to your account.** Save it somewhere safe — it will not be shown again.",
            color: 0x00d7dc,
            fields: [
              { name: "Username", value: profile.username, inline: true },
              { name: "Login Key", value: `\`${profile.login_key}\``, inline: true },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    }).catch((e) => console.error("Failed to deliver key:", e));

    return json({ ok: true, username: profile.username });
  } catch (e) {
    console.error("signup error", e);
    return json({ error: "Internal error" }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
