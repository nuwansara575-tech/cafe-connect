import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, CheckCircle, XCircle, Loader2, ShieldCheck } from "lucide-react";

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
      setError("Coupon not found");
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

    const { data, error: err } = await supabase.functions.invoke("coupons/redeem", {
      body: { coupon_code: coupon.coupon_code },
    });

    setRedeeming(false);

    if (err || !data?.success) {
      toast.error(data?.error || "Failed to redeem coupon");
      return;
    }

    toast.success("Coupon redeemed successfully!");
    setCoupon({ ...coupon, status: "redeemed", redeemed_at: new Date().toISOString() });
    setError("");
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "claimed": return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Claimed</Badge>;
      case "redeemed": return <Badge className="bg-success/10 text-success border-success/20">Redeemed</Badge>;
      case "expired": return <Badge variant="secondary">Expired</Badge>;
      case "scanned": return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Scanned</Badge>;
      case "unused": return <Badge variant="outline">Unused</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-3xl font-display font-bold text-foreground">Redeem Coupon</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Cashier Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Coupon Code</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="e.g. CC-15-A8F3B2C1"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="font-mono"
              />
              <Button onClick={handleVerify} disabled={verifying}>
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-destructive text-sm">
              <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {coupon && (
            <div className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-lg">{coupon.coupon_code}</span>
                {statusBadge(coupon.status)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Discount:</span>
                  <p className="font-medium">{coupon.discount_value}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Offer:</span>
                  <p className="font-medium">{coupon.offer_title}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Customer Phone:</span>
                  <p className="font-medium">{coupon.customer_phone || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Customer Name:</span>
                  <p className="font-medium">{coupon.customer_name || "—"}</p>
                </div>
                {coupon.claimed_at && (
                  <div>
                    <span className="text-muted-foreground">Claimed:</span>
                    <p className="font-medium">{new Date(coupon.claimed_at).toLocaleString()}</p>
                  </div>
                )}
                {coupon.redeemed_at && (
                  <div>
                    <span className="text-muted-foreground">Redeemed:</span>
                    <p className="font-medium">{new Date(coupon.redeemed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {coupon.status === "claimed" && (
                <Button
                  onClick={handleRedeem}
                  disabled={redeeming}
                  className="w-full gradient-cafe text-primary-foreground shadow-cafe mt-2"
                  size="lg"
                >
                  {redeeming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  {redeeming ? "Redeeming..." : "Redeem Coupon"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
