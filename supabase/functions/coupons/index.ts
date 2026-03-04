import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const action = url.pathname.split("/").pop();

  // Extract device/IP for scan tracking
  const device = req.headers.get("user-agent") || "unknown";
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown";

  try {
    // REDEEM
    if (req.method === "POST" && action === "redeem") {
      const { token } = await req.json();
      if (!token) {
        return new Response(JSON.stringify({ error: "Token required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("coupons")
        .update({ status: "redeemed", redeemed_at: new Date().toISOString() })
        .eq("token", token)
        .eq("status", "unused")
        .select()
        .maybeSingle();

      if (error) {
        return new Response(JSON.stringify({ error: "Server error" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!data) {
        const { data: existing } = await supabase
          .from("coupons").select("status, id").eq("token", token).maybeSingle();

        // Record failed scan
        await supabase.from("scans").insert({
          token, device, ip_address: ipAddress, success: false,
          coupon_id: existing?.id || null,
        });

        if (!existing) {
          return new Response(JSON.stringify({ error: "Invalid token", status: "invalid" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(
          JSON.stringify({ error: "Already redeemed", status: existing.status }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Record successful scan
      await supabase.from("scans").insert({
        token, device, ip_address: ipAddress, success: true, coupon_id: data.id,
      });

      return new Response(
        JSON.stringify({ success: true, coupon_code: data.coupon_code, status: "redeemed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // VALIDATE
    if (req.method === "POST" && action === "validate") {
      const { token } = await req.json();
      if (!token) {
        return new Response(JSON.stringify({ error: "Token required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("coupons").select("*").eq("token", token).maybeSingle();

      // Record scan
      await supabase.from("scans").insert({
        token, device, ip_address: ipAddress,
        success: !!(data && data.status === "unused"),
        coupon_id: data?.id || null,
      });

      if (error || !data) {
        return new Response(JSON.stringify({ error: "Invalid token", status: "invalid" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        if (data.status === "unused") {
          await supabase.from("coupons").update({ status: "expired" }).eq("id", data.id);
        }
        return new Response(
          JSON.stringify({ status: "expired", offer_title: data.offer_title }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({
        status: data.status,
        offer_title: data.offer_title,
        offer_description: data.offer_description,
        discount_value: data.discount_value,
        campaign_name: data.campaign_name,
        coupon_code: data.status === "redeemed" ? data.coupon_code : undefined,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GENERATE
    if (req.method === "POST" && action === "generate") {
      const { count = 10, campaign_name, offer_title, offer_description, discount_value, expires_at, campaign_id } = await req.json();

      const coupons = [];
      for (let i = 0; i < Math.min(count, 500); i++) {
        const prefix = (discount_value || "15%").replace(/[^a-zA-Z0-9]/g, "").substring(0, 6);
        const code = `CC-${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        coupons.push({
          campaign_name: campaign_name || "Cafe Connect – Special Promotion",
          offer_title: offer_title || (discount_value?.includes("%") ? `Get ${discount_value} OFF your order` : `Enjoy a ${discount_value}`),
          offer_description: offer_description || "Present this coupon at checkout to enjoy your discount.",
          discount_value: discount_value || "15%",
          coupon_code: code,
          expires_at: expires_at || null,
          campaign_id: campaign_id || null,
        });
      }

      const { data, error } = await supabase.from("coupons").insert(coupons).select();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, count: data.length, coupons: data }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // STATS
    if ((req.method === "GET" || req.method === "POST") && action === "stats") {
      const { data: all } = await supabase.from("coupons").select("status");
      const total = all?.length || 0;
      const redeemed = all?.filter((c) => c.status === "redeemed").length || 0;
      const unused = all?.filter((c) => c.status === "unused").length || 0;
      const expired = all?.filter((c) => c.status === "expired").length || 0;

      return new Response(JSON.stringify({
        total, redeemed, unused, expired,
        conversion_rate: total > 0 ? ((redeemed / total) * 100).toFixed(1) : "0",
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
