import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { QrCode, Loader2, Sparkles, Tag, FileText, Hash, Link2 } from "lucide-react";

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

    const { data, error } = await supabase.functions.invoke("coupons/generate", {
      body: {
        count,
        discount_value: finalDiscount,
        campaign_name: campaignName,
        offer_title: offerTitle || (finalDiscount.includes("%") ? `Get ${finalDiscount} OFF your order` : `Enjoy a ${finalDiscount}`),
        offer_description: offerDescription,
        campaign_id: campaignId && campaignId !== "none" ? campaignId : undefined,
      },
    });
    setGenerating(false);
    if (error) { toast.error("Failed to generate coupons"); return; }
    toast.success(`Generated ${data.count} coupons!`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Generate QR Coupons</h1>
        <p className="text-muted-foreground mt-1">Create bulk QR coupons for your campaigns</p>
      </div>

      {/* Main Form Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
        <CardContent className="p-6 pt-8 space-y-6">

          {/* Campaign Link */}
          {campaigns.length > 0 && (
            <FormField icon={<Link2 className="w-4 h-4 text-primary" />} label="Link to Campaign" hint="Optionally associate coupons with a campaign">
              <Select value={campaignId} onValueChange={handleCampaignSelect}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select campaign (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No campaign</SelectItem>
                  {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          )}

          {/* Campaign Name */}
          <FormField icon={<FileText className="w-4 h-4 text-primary" />} label="Campaign Name" hint="Name shown on the coupon">
            <Input value={campaignName} onChange={e => setCampaignName(e.target.value)} className="h-11" />
          </FormField>

          {/* Offer Type */}
          <FormField icon={<Tag className="w-4 h-4 text-primary" />} label="Offer Type" hint="Choose a discount type or enter a custom value">
            <Select value={discountValue} onValueChange={val => {
              setDiscountValue(val);
              setOfferDescription(val === "Free Item" ? "Present this coupon at checkout to claim your free item." : "Present this coupon at checkout to enjoy your discount.");
            }}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
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
              <Input className="mt-2 h-11" value={customDiscount} onChange={e => setCustomDiscount(e.target.value)} placeholder="e.g. Free Dessert, 30% OFF" />
            )}
          </FormField>

          {/* Offer Title */}
          <FormField icon={<Sparkles className="w-4 h-4 text-primary" />} label="Offer Title" hint="Leave empty to auto-generate from discount">
            <Input value={offerTitle} onChange={e => setOfferTitle(e.target.value)} placeholder="Auto-generated if empty" className="h-11" />
          </FormField>

          {/* Offer Description */}
          <FormField icon={<FileText className="w-4 h-4 text-muted-foreground" />} label="Offer Description">
            <Input value={offerDescription} onChange={e => setOfferDescription(e.target.value)} className="h-11" />
          </FormField>

          {/* Count */}
          <FormField icon={<Hash className="w-4 h-4 text-primary" />} label="Number of Coupons" hint="How many unique QR coupons to generate (max 500)">
            <Input type="number" value={count} onChange={e => setCount(Number(e.target.value))} min={1} max={500} className="h-11" />
          </FormField>

          {/* Divider */}
          <div className="border-t" />

          {/* Summary */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Summary</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Coupons:</span>
                <span className="ml-2 font-semibold text-foreground">{count}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Discount:</span>
                <span className="ml-2 font-semibold text-foreground">{discountValue === "Custom" ? (customDiscount || "—") : discountValue}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Campaign:</span>
                <span className="ml-2 font-semibold text-foreground">{campaignName}</span>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button onClick={handleGenerate} disabled={generating} className="w-full gradient-cafe text-primary-foreground shadow-cafe h-12 text-base font-semibold" size="lg">
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <QrCode className="w-5 h-5 mr-2" />
                Generate {count} Coupons
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function FormField({ icon, label, hint, children }: { icon: React.ReactNode; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {icon}
        <Label className="text-sm font-medium">{label}</Label>
      </div>
      {hint && <p className="text-xs text-muted-foreground ml-6">{hint}</p>}
      <div className="ml-6">{children}</div>
    </div>
  );
}
