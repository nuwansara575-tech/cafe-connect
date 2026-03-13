import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, CheckCircle, XCircle, Loader2, ShieldCheck, Gift, User, Phone, Clock, Tag, TicketCheck, AlertTriangle } from "lucide-react";

interface VerifiedCoupon {
  coupon_code: string;
  status: string;
  customer_phone: string | null;
  customer_name: string | null;
  discount_value: string;
  offer_title: string;
  campaign_name: string;
  claimed_at: string | null;
  redeemed_at: string | null;
}

export default function RedeemCoupon() {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [coupon, setCoupon] = useState<VerifiedCoupon | null>(null);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (!code.trim()) { setError("Enter a coupon code"); return; }
    setError("");
    setCoupon(null);
    setVerifying(true);

    const { data, error: err } = await supabase
      .from("coupons")
      .select("coupon_code, status, customer_phone, customer_name, discount_value, offer_title, campaign_name, claimed_at, redeemed_at")
      .eq("coupon_code", code.trim().toUpperCase())
      .maybeSingle();

    setVerifying(false);

    if (err || !data) {
      setError("Coupon not found. Please check the code and try again.");
      return;
    }

    setCoupon(data as VerifiedCoupon);

    if (data.status === "redeemed") setError("This coupon has already been redeemed.");
    else if (data.status === "expired") setError("This coupon has expired.");
    else if (data.status !== "claimed") setError("This coupon has not been claimed by a customer yet.");
  };

  const handleRedeem = async () => {
    if (!coupon || redeeming) return;
    setRedeeming(true);

    const { data, error: err } = await invokeEdgeFunction("coupons/redeem", {
      coupon_code: coupon.coupon_code,
    });

    setRedeeming(false);

    if (err || !data?.success) {
      toast.error(data?.error || err?.message || "Failed to redeem coupon");
      return;
    }

    toast.success("Coupon redeemed successfully!");
    setCoupon({ ...coupon, status: "redeemed", redeemed_at: new Date().toISOString() });
    setError("");
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      claimed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      redeemed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      expired: "bg-destructive/10 text-destructive border-destructive/20",
      scanned: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      unused: "bg-muted text-muted-foreground border-border",
    };
    return <Badge className={`text-xs font-semibold ${styles[status] || ""}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const canRedeem = coupon?.status === "claimed";

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Redeem Coupon</h1>
        <p className="text-muted-foreground mt-1">Enter the customer's coupon code to verify and redeem</p>
      </div>

      {/* Search Card */}
      <Card className="relative overflow-hidden glass-strong border-border/40">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
        <CardContent className="p-6 pt-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-primary/15 rounded-xl p-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Verification</h2>
              <p className="text-xs text-muted-foreground">Look up a coupon code to verify its status</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter coupon code (e.g. CC-15-A8F3B2C1)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="pl-9 font-mono text-sm h-11"
              />
            </div>
            <Button onClick={handleVerify} disabled={verifying} size="lg" className="px-6">
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
            </Button>
          </div>

          {/* Error Message */}
          {error && !coupon && (
            <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coupon Details Card */}
      {coupon && (
        <Card className="relative overflow-hidden glass-strong border-border/40">
          {/* Status indicator stripe */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${
            canRedeem ? "bg-blue-500" : coupon.status === "redeemed" ? "bg-emerald-500" : "bg-destructive"
          }`} />

          <CardContent className="p-6 pt-8 space-y-6">
            {/* Top: Code + Status */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-2.5 ${canRedeem ? "bg-blue-500/15" : coupon.status === "redeemed" ? "bg-emerald-500/15" : "bg-destructive/15"}`}>
                  <TicketCheck className={`w-5 h-5 ${canRedeem ? "text-blue-500" : coupon.status === "redeemed" ? "text-emerald-500" : "text-destructive"}`} />
                </div>
                <div>
                  <p className="font-mono font-bold text-lg text-foreground tracking-wide">{coupon.coupon_code}</p>
                  <p className="text-xs text-muted-foreground">{coupon.campaign_name}</p>
                </div>
              </div>
              {statusBadge(coupon.status)}
            </div>

            {/* Warning/Error for non-claimable */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow icon={<Gift className="w-4 h-4 text-primary" />} label="Offer" value={coupon.offer_title} />
              <DetailRow icon={<Tag className="w-4 h-4 text-primary" />} label="Discount" value={coupon.discount_value} />
              <DetailRow icon={<User className="w-4 h-4 text-blue-500" />} label="Customer" value={coupon.customer_name || "—"} />
              <DetailRow icon={<Phone className="w-4 h-4 text-blue-500" />} label="Phone" value={coupon.customer_phone || "—"} />
              {coupon.claimed_at && (
                <DetailRow icon={<Clock className="w-4 h-4 text-muted-foreground" />} label="Claimed" value={new Date(coupon.claimed_at).toLocaleString()} />
              )}
              {coupon.redeemed_at && (
                <DetailRow icon={<CheckCircle className="w-4 h-4 text-emerald-500" />} label="Redeemed" value={new Date(coupon.redeemed_at).toLocaleString()} />
              )}
            </div>

            {/* Redeem Button */}
            {canRedeem && (
              <Button
                onClick={handleRedeem}
                disabled={redeeming}
                className="w-full gradient-cafe text-primary-foreground shadow-cafe h-12 text-base font-semibold"
                size="lg"
              >
                {redeeming ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Confirm Redemption
                  </>
                )}
              </Button>
            )}

            {/* Success state */}
            {coupon.status === "redeemed" && coupon.redeemed_at && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">Successfully Redeemed</p>
                  <p className="text-xs text-muted-foreground">This coupon has been marked as used and cannot be redeemed again.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
