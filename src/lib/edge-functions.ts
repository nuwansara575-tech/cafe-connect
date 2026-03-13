import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const SUPABASE_ANON_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  ""
).trim();

export async function invokeEdgeFunction(
  functionPath: string,
  body: Record<string, unknown>
): Promise<{ data: any; error: Error | null }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return {
      data: null,
      error: new Error("Missing backend URL or anon key configuration"),
    };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    const authorization = accessToken ? `Bearer ${accessToken}` : `Bearer ${SUPABASE_ANON_KEY}`;

    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/${functionPath.replace(/^\/+/, "")}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: authorization,
        },
        body: JSON.stringify(body),
      }
    );

    const contentType = res.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await res.json()
      : await res.text();

    if (!res.ok) {
      const message =
        typeof payload === "object" && payload && "error" in payload
          ? String((payload as { error?: string }).error)
          : `HTTP ${res.status}`;
      return { data: payload, error: new Error(message) };
    }

    return { data: payload, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

