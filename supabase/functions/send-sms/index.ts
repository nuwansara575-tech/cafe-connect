import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TEXTLK_API_TOKEN = Deno.env.get("TEXTLK_API_TOKEN");
    if (!TEXTLK_API_TOKEN) {
      throw new Error("TEXTLK_API_TOKEN is not configured");
    }

    const TEXTLK_SENDER_ID = Deno.env.get("TEXTLK_SENDER_ID");
    if (!TEXTLK_SENDER_ID) {
      throw new Error("TEXTLK_SENDER_ID is not configured");
    }

    const { to, message } = await req.json();

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: "Missing 'to' or 'message' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone number - ensure it starts with country code
    let phone = to.replace(/\s+/g, "").replace(/^0/, "94");
    if (!phone.startsWith("+")) {
      phone = "+" + phone;
    }

    const response = await fetch("https://app.text.lk/api/v3/sms/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TEXTLK_API_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        recipient: phone,
        sender_id: TEXTLK_SENDER_ID,
        message: message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Text.lk API error:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "SMS sending failed", details: data }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send SMS error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
