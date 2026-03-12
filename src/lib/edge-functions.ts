// Helper to call edge functions on the external Supabase project
// This bypasses supabase.functions.invoke() which routes to Lovable Cloud

import { supabase } from "@/integrations/supabase/client";

const EXTERNAL_SUPABASE_URL = "https://kiodbjklpyphaqhvijai.supabase.co";
const EXTERNAL_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpb2RiamtscHlwaGFxaHZpamFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyOTA4OTksImV4cCI6MjA4ODg2Njg5OX0.SM95O5xq_pGrw-drk64rj0Cjh9KCq40PKwDxXxhYuXk";

export async function invokeEdgeFunction(
  functionPath: string,
  body: Record<string, unknown>
): Promise<{ data: any; error: Error | null }> {
  try {
    // Get current session token for auth
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "apikey": EXTERNAL_ANON_KEY,
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const res = await fetch(
      `${EXTERNAL_SUPABASE_URL}/functions/v1/${functionPath}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return { data, error: new Error(data.error || `HTTP ${res.status}`) };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}
