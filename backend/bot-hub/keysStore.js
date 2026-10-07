import { supabase } from "../config/supabase.js";
import { encryptSecret, decryptSecret } from "./crypto.js";
import { toPublic } from "./connectionInput.js";

const fail = (error) => {
  if (error) throw new Error(error.message);
};

export async function listKeys(userId) {
  const { data, error } = await supabase.from("user_api_keys").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  fail(error);
  return data.map(toPublic);
}

export async function saveKey(userId, { exchange, apiKey, apiSecret, label }) {
  const { enc, iv, tag } = encryptSecret(apiSecret);
  const { data, error } = await supabase
    .from("user_api_keys")
    .upsert(
      { user_id: userId, exchange, api_key: apiKey, api_secret_enc: enc, api_secret_iv: iv, api_secret_tag: tag, label: label || null, live_enabled: false, updated_at: new Date().toISOString() },
      { onConflict: "user_id,exchange" },
    )
    .select()
    .single();
  fail(error);
  return toPublic(data);
}

export async function deleteKey(userId, exchange) {
  const { error } = await supabase.from("user_api_keys").delete().eq("user_id", userId).eq("exchange", exchange);
  fail(error);
}

export async function setLive(userId, exchange, live) {
  const { data, error } = await supabase.from("user_api_keys").update({ live_enabled: live }).eq("user_id", userId).eq("exchange", exchange).select().maybeSingle();
  fail(error);
  return data ? toPublic(data) : null;
}

export async function loadCredentials(userId, exchange = "binance") {
  const { data, error } = await supabase.from("user_api_keys").select("*").eq("user_id", userId).eq("exchange", exchange).maybeSingle();
  fail(error);
  if (!data) return null;
  return {
    apiKey: data.api_key,
    apiSecret: decryptSecret({ enc: data.api_secret_enc, iv: data.api_secret_iv, tag: data.api_secret_tag }),
    live: Boolean(data.live_enabled),
  };
}
