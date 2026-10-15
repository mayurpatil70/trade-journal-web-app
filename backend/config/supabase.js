// backend/config/supabase.js
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseKey);
