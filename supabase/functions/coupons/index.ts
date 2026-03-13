import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function requireAdmin(req: Request, supabase: any): Promise<Response | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return jsonResponse({ error: "Unauthorized" }, 401);
  const { data: roleRow } = await supabase
    .from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
  if (!roleRow) return jsonResponse({ error: "Forbidden" }, 403);
  return null;
}

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
  const device = req.headers.get("user-agent") || "unknown";
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown";

  try {
    // VALIDATE — called when QR is scanned, marks coupon as "scanned"
    if (req.method === "POST" && action === "validate") {
      const { token } = await req.json();
      if (!token) return jsonResponse({ error: "Token required" }, 400);

      const { data, error } = await supabase
        .from("coupons").select("*").eq("token", token).maybeSingle();

      // Record scan
      await supabase.from("scans").insert({
        token, device, ip_address: ipAddress,
        success: !!(data && ["unused", "scanned"].includes(data.status)),
        coupon_id: data?.id || null,
      });

      if (error || !data) return jsonResponse({ error: "Invalid token", status: "invalid" }, 404);

      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        if (["unused", "scanned"].includes(data.status)) {
          await supabase.from("coupons").update({ status: "expired" }).eq("id", data.id);
        }
        return jsonResponse({ status: "expired", offer_title: data.offer_title });
      }

      // If unused, mark as scanned
      if (data.status === "unused") {
        await supabase.from("coupons")
          .update({ status: "scanned", scanned_at: new Date().toISOString() })
          .eq("id", data.id);
      }

      return jsonResponse({
        status: data.status === "unused" ? "scanned" : data.status,
        offer_title: data.offer_title,
        offer_description: data.offer_description,
        discount_value: data.discount_value,
        campaign_name: data.campaign_name,
      });
    }

    // CLAIM — customer submits phone number to claim coupon
    if (req.method === "POST" && action === "claim") {
      const { token, phone, name } = await req.json();
      if (!token) return jsonResponse({ error: "Token required" }, 400);
      if (!phone || typeof phone !== "string" || phone.trim().length < 7) {
        return jsonResponse({ error: "Valid phone number required" }, 400);
      }

      // Get coupon
      const { data: coupon, error } = await supabase
        .from("coupons").select("*").eq("token", token).maybeSingle();

      if (error || !coupon) return jsonResponse({ error: "Invalid token", status: "invalid" }, 404);

      // Only scanned or unused coupons can be claimed
      if (!["unused", "scanned"].includes(coupon.status)) {
        return jsonResponse({
          error: coupon.status === "claimed" ? "Already claimed" : coupon.status === "redeemed" ? "Already redeemed" : "Coupon expired",
          status: coupon.status,
        }, 409);
      }

      // Check expiry
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        await supabase.from("coupons").update({ status: "expired" }).eq("id", coupon.id);
        return jsonResponse({ error: "Coupon expired", status: "expired" }, 409);
      }

      // Check duplicate phone for same coupon
      if (coupon.customer_phone && coupon.customer_phone === phone.trim()) {
        return jsonResponse({ error: "Already claimed with this phone", status: "claimed" }, 409);
      }

      // Update coupon to claimed
      const { data: updated, error: updateErr } = await supabase
        .from("coupons")
        .update({
          status: "claimed",
          claimed_at: new Date().toISOString(),
          scanned_at: coupon.scanned_at || new Date().toISOString(),
          customer_phone: phone.trim(),
          customer_name: name?.trim() || null,
        })
        .eq("id", coupon.id)
        .in("status", ["unused", "scanned"])
        .select()
        .maybeSingle();

      if (updateErr || !updated) {
        console.error("Claim update failed:", updateErr, "updated:", updated);
        return jsonResponse({ error: "Failed to claim coupon" }, 500);
      }

      return jsonResponse({
        success: true,
        status: "claimed",
        coupon_code: updated.coupon_code,
        offer_title: updated.offer_title,
        discount_value: updated.discount_value,
      });
    }

    // REDEEM — admin/cashier manually redeems a coupon by code (requires auth)
    if (req.method === "POST" && action === "redeem") {
      const denied = await requireAdmin(req, supabase);
      if (denied) return denied;

      const { coupon_code } = await req.json();
      if (!coupon_code) return jsonResponse({ error: "Coupon code required" }, 400);

      // Look up coupon by code
      const { data: coupon, error } = await supabase
        .from("coupons").select("*").eq("coupon_code", coupon_code.trim().toUpperCase()).maybeSingle();

      if (error || !coupon) return jsonResponse({ error: "Coupon not found", status: "invalid" }, 404);

      if (coupon.status === "redeemed") {
        return jsonResponse({ error: "Already redeemed", status: "redeemed", redeemed_at: coupon.redeemed_at }, 409);
      }
      if (coupon.status === "expired") {
        return jsonResponse({ error: "Coupon expired", status: "expired" }, 409);
      }
      if (coupon.status !== "claimed") {
        return jsonResponse({ error: "Coupon must be claimed by customer first", status: coupon.status }, 409);
      }

      // Check expiry
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        await supabase.from("coupons").update({ status: "expired" }).eq("id", coupon.id);
        return jsonResponse({ error: "Coupon expired", status: "expired" }, 409);
      }

      // Redeem
      const { data: redeemed, error: redeemErr } = await supabase
        .from("coupons")
        .update({ status: "redeemed", redeemed_at: new Date().toISOString() })
        .eq("id", coupon.id)
        .eq("status", "claimed")
        .select()
        .maybeSingle();

      if (redeemErr || !redeemed) return jsonResponse({ error: "Failed to redeem" }, 500);

      return jsonResponse({
        success: true,
        status: "redeemed",
        coupon_code: redeemed.coupon_code,
        customer_phone: redeemed.customer_phone,
        customer_name: redeemed.customer_name,
        discount_value: redeemed.discount_value,
        offer_title: redeemed.offer_title,
      });
    }

    // GENERATE — admin only
    if (req.method === "POST" && action === "generate") {
      const denied = await requireAdmin(req, supabase);
      if (denied) return denied;

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
      if (error) return jsonResponse({ error: error.message }, 500);

      return jsonResponse({ success: true, count: data.length, coupons: data });
    }

    // STATS — admin only
    if ((req.method === "GET" || req.method === "POST") && action === "stats") {
      const denied = await requireAdmin(req, supabase);
      if (denied) return denied;

      const { data: all } = await supabase.from("coupons").select("status");
      const total = all?.length || 0;
      const redeemed = all?.filter((c) => c.status === "redeemed").length || 0;
      const claimed = all?.filter((c) => c.status === "claimed").length || 0;
      const scanned = all?.filter((c) => c.status === "scanned").length || 0;
      const unused = all?.filter((c) => c.status === "unused").length || 0;
      const expired = all?.filter((c) => c.status === "expired").length || 0;

      return jsonResponse({
        total, redeemed, claimed, scanned, unused, expired,
        conversion_rate: total > 0 ? ((redeemed / total) * 100).toFixed(1) : "0",
        claim_rate: total > 0 ? ((claimed / total) * 100).toFixed(1) : "0",
      });
    }

    return jsonResponse({ error: "Not found" }, 404);
  } catch (err) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
