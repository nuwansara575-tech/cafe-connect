import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/edge-functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { QrCode, Loader2 } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  offer: string;
}

export default function GenerateQR() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState("");
  const [count, setCount] = useState(10);
  const [discountValue, setDiscountValue] = useState("15%");
  const [customDiscount, setCustomDiscount] = useState("");
  const [campaignName, setCampaignName] = useState("Cafe Connect – Special Promotion");
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDescription, setOfferDescription] = useState("Present this coupon at checkout to enjoy your discount.");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    supabase.from("campaigns").select("id, name, offer").eq("status", "active").then(({ data }) => {
      if (data) setCampaigns(data);
    });
  }, []);

  const handleCampaignSelect = (id: string) => {
    setCampaignId(id);
    if (id !== "none") {
      const c = campaigns.find(c => c.id === id);
      if (c) {
        setCampaignName(c.name);
        setDiscountValue(c.offer);
      }
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const finalDiscount = discountValue === "Custom" ? customDiscount : discountValue;
    if (!finalDiscount) { toast.error("Please enter a discount value"); setGenerating(false); return; }

    const { data, error } = await invokeEdgeFunction("coupons/generate", {
      count,
      discount_value: finalDiscount,
      campaign_name: campaignName,
      offer_title: offerTitle || (finalDiscount.includes("%") ? `Get ${finalDiscount} OFF your order` : `Enjoy a ${finalDiscount}`),
      offer_description: offerDescription,
      campaign_id: campaignId && campaignId !== "none" ? campaignId : undefined,
    });
    setGenerating(false);
    if (error) { toast.error("Failed to generate coupons"); return; }
    toast.success(`Generated ${data.count} coupons!`);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Generate QR Coupons</h1>
        <p className="text-sm text-muted-foreground mt-1">Create bulk QR coupons for your campaigns</p>
      </div>

      <Card className="glass-strong border-border/40">
        <CardContent className="p-6 space-y-5">
          {campaigns.length > 0 && (
            <div className="space-y-1.5">
              <Label>Link to Campaign</Label>
              <Select value={campaignId} onValueChange={handleCampaignSelect}>
                <SelectTrigger><SelectValue placeholder="Select campaign (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No campaign</SelectItem>
                  {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Campaign Name</Label>
            <Input value={campaignName} onChange={e => setCampaignName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Offer Type</Label>
            <Select value={discountValue} onValueChange={val => {
              setDiscountValue(val);
              setOfferDescription(val === "Free Item" ? "Present this coupon at checkout to claim your free item." : "Present this coupon at checkout to enjoy your discount.");
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10%">10% Discount</SelectItem>
                <SelectItem value="15%">15% Discount</SelectItem>
                <SelectItem value="20%">20% Discount</SelectItem>
                <SelectItem value="25%">25% Discount</SelectItem>
                <SelectItem value="50%">50% Discount</SelectItem>
                <SelectItem value="Free Item">Free Item</SelectItem>
                <SelectItem value="Buy 1 Get 1">Buy 1 Get 1</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {discountValue === "Custom" && (
              <Input className="mt-2" value={customDiscount} onChange={e => setCustomDiscount(e.target.value)} placeholder="e.g. Free Dessert, 30% OFF" />
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Offer Title <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input value={offerTitle} onChange={e => setOfferTitle(e.target.value)} placeholder="Auto-generated if empty" />
          </div>

          <div className="space-y-1.5">
            <Label>Offer Description</Label>
            <Input value={offerDescription} onChange={e => setOfferDescription(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Number of Coupons</Label>
            <Input type="number" value={count} onChange={e => setCount(Number(e.target.value))} min={1} max={500} />
          </div>

          <Button onClick={handleGenerate} disabled={generating} className="w-full gradient-cafe text-primary-foreground shadow-cafe h-11 font-semibold" size="lg">
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <QrCode className="w-4 h-4 mr-2" />}
            {generating ? "Generating..." : `Generate ${count} Coupons`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
