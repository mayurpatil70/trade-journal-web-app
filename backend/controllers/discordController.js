// backend/controllers/discordController.js
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

export const handleDiscordCallback = async (req, res) => {
  const { code, state, error } = req.query;

  if (error || !code || !state) {
    console.error("Discord Auth Cancelled or Missing Params");
    return res.redirect("http://localhost:5173/link-discord?error=auth_failed");
  }

  const userId = state;

  try {
    // 1. Get Discord Token
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID.trim(),
        client_secret: process.env.DISCORD_CLIENT_SECRET.trim(),
        grant_type: "authorization_code",
        code: code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI.trim(),
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    const { access_token } = tokenResponse.data;

    // 2. Fetch User's Servers
    const guildsResponse = await axios.get(
      "https://discord.com/api/users/@me/guilds",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    const targetGuildId = process.env.DISCORD_GUILD_ID.trim();

    // 3. Check for Server Membership
    const isMember = guildsResponse.data.some(
      (guild) => guild.id === targetGuildId,
    );

    if (isMember) {
      console.log(
        `Success: User ${userId} found in Discord server. Updating database...`,
      );

      const { error: updateError } = await supabase
        .from("users")
        .update({ discord_verified: true })
        .eq("id", userId);

      if (updateError) {
        console.error("Supabase Database Update Failed:", updateError.message);
        throw new Error("Database update failed");
      }

      // Safe Redirect to Dashboard
      return res.redirect("http://localhost:5173/dashboard?verified=true");
    } else {
      console.warn(
        `Blocked: User is NOT in the server. Expected Guild ID: ${targetGuildId}`,
      );
      return res.redirect(
        "http://localhost:5173/link-discord?error=not_in_server",
      );
    }
  } catch (err) {
    console.error(
      "Complete Discord Auth Error:",
      err.response?.data || err.message,
    );
    return res.redirect(
      "http://localhost:5173/link-discord?error=server_error",
    );
  }
};
