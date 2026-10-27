import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xtkkdzthgusjxjzljhqb.supabase.co";
const supabasePublishableKey = "sb_publishable_mj8-vlJAvqijqM--F3N9kQ_AK3vX30U";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
