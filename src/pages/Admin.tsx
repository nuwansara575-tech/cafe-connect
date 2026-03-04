import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  QrCode, Download, RefreshCw, ArrowLeft, BarChart3,
  Package, CheckCircle, XCircle, Clock, Loader2, Trash2
} from "lucide-react";
import logoWhite from "@/assets/logo-white.png";

interface Coupon {
  id: string;
  token: string;
  campaign_name: string;
  offer_title: string;
  discount_value: string;
  status: string;
  coupon_code: string;
  created_at: string;
  redeemed_at: string | null;
}

interface Stats {
  total: number;
  redeemed: number;
  unused: number;
  expired: number;
  conversion_rate: string;
}

const Admin = () => {
  const [tab, setTab] = useState<"generate" | "list" | "analytics">("generate");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Generation form
  const [count, setCount] = useState(10);
  const [discountValue, setDiscountValue] = useState("15%");
  const [customDiscount, setCustomDiscount] = useState("");
  const [campaignName, setCampaignName] = useState("Cafe Connect – Special Promotion");
  const [offerTitle, setOfferTitle] = useState("");
  const [offerDescription, setOfferDescription] = useState("Present this coupon at checkout to enjoy your discount.");

  const baseUrl = window.location.origin;

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("coupons").select("*").order("created_at", { ascending: false }).limit(200);
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    const { data } = await query;
    setCoupons((data as Coupon[]) || []);
    setLoading(false);
  }, [statusFilter]);

  const fetchStats = useCallback(async () => {
    const { data } = await supabase.functions.invoke("coupons/stats");
    if (data) setStats(data);
  }, []);

  useEffect(() => {
    fetchCoupons();
    fetchStats();
  }, [fetchCoupons, fetchStats]);

  const handleGenerate = async () => {
    setGenerating(true);
    const finalDiscount = discountValue === "Custom" ? customDiscount : discountValue;
    if (!finalDiscount) {
      toast.error("Please enter a discount value");
      setGenerating(false);
      return;
    }
    const { data, error } = await supabase.functions.invoke("coupons/generate", {
      body: {
        count,
        discount_value: finalDiscount,
        campaign_name: campaignName,
        offer_title: offerTitle || (finalDiscount.includes("%") ? `Get ${finalDiscount} OFF your order` : `Enjoy a ${finalDiscount}`),
        offer_description: offerDescription,
      },
    });
    setGenerating(false);
    if (error) {
      toast.error("Failed to generate coupons");
      return;
    }
    toast.success(`Generated ${data.count} coupons!`);
    fetchCoupons();
    fetchStats();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete coupon");
      return;
    }
    toast.success("Coupon deleted");
    setCoupons(prev => prev.filter(c => c.id !== id));
    fetchStats();
  };

  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQR = async (coupon: Coupon) => {
    const div = document.createElement("div");
    div.style.padding = "20px";
    div.style.background = "white";
    div.style.display = "inline-block";
    document.body.appendChild(div);

    const { createRoot } = await import("react-dom/client");
    const root = createRoot(div);

    await new Promise<void>((resolve) => {
      root.render(
        <div style={{ padding: 20, background: "white", textAlign: "center" }}>
          <QRCodeSVG
            value={`${baseUrl}/promo/redeem?token=${coupon.token}`}
            size={256}
            level="H"
            fgColor="#fc6719"
          />
          <p style={{ marginTop: 8, fontSize: 12, color: "#666", fontFamily: "monospace" }}>{coupon.coupon_code}</p>
          <p style={{ fontSize: 11, color: "#999" }}>{coupon.discount_value.includes("%") ? `${coupon.discount_value} OFF` : coupon.discount_value}</p>
        </div>
      );
      setTimeout(resolve, 100);
    });

    try {
      const dataUrl = await toPng(div);
      const link = document.createElement("a");
      link.download = `qr-${coupon.coupon_code}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error("Failed to download QR");
    }
    root.unmount();
    document.body.removeChild(div);
  };

  const downloadAllQRs = async () => {
    const unusedCoupons = coupons.filter(c => c.status === "unused");
    if (unusedCoupons.length === 0) {
      toast.error("No unused coupons to export");
      return;
    }
    toast.info(`Downloading ${unusedCoupons.length} QR codes...`);
    for (const coupon of unusedCoupons.slice(0, 50)) {
      await downloadQR(coupon);
      await new Promise(r => setTimeout(r, 200));
    }
    toast.success("QR codes downloaded!");
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "unused": return <Badge className="bg-success/10 text-success border-success/20">Unused</Badge>;
      case "redeemed": return <Badge className="bg-primary/10 text-primary border-primary/20">Redeemed</Badge>;
      case "expired": return <Badge variant="secondary">Expired</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
          </Link>
          <img src={logoWhite} alt="Cafe Connect" className="h-10" />
          <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Admin Dashboard</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border px-6">
        <div className="flex gap-1">
          {[
            { key: "generate", label: "Generate QR", icon: QrCode },
            { key: "list", label: "Coupons", icon: Package },
            { key: "analytics", label: "Analytics", icon: BarChart3 },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Generate Tab */}
        {tab === "generate" && (
          <div className="max-w-lg">
            <h2 className="text-2xl font-display font-bold text-foreground mb-6">Generate QR Coupons</h2>
            <div className="space-y-4">
              <div>
                <Label>Campaign Name</Label>
                <Input value={campaignName} onChange={e => setCampaignName(e.target.value)} />
              </div>
              <div>
                <Label>Offer Type</Label>
                <Select value={discountValue} onValueChange={(val) => {
                  setDiscountValue(val);
                  if (val === "Free Item") {
                    setOfferTitle("");
                    setOfferDescription("Present this coupon at checkout to claim your free item.");
                  } else {
                    setOfferTitle("");
                    setOfferDescription("Present this coupon at checkout to enjoy your discount.");
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10%">10% Discount</SelectItem>
                    <SelectItem value="15%">15% Discount</SelectItem>
                    <SelectItem value="20%">20% Discount</SelectItem>
                    <SelectItem value="25%">25% Discount</SelectItem>
                    <SelectItem value="50%">50% Discount</SelectItem>
                    <SelectItem value="Free Item">Free Item (e.g. Free Wine)</SelectItem>
                    <SelectItem value="Buy 1 Get 1">Buy 1 Get 1</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {discountValue === "Custom" && (
                  <Input className="mt-2" value={customDiscount} onChange={e => setCustomDiscount(e.target.value)} placeholder="e.g. Free Dessert, 30% OFF" />
                )}
              </div>
              <div>
                <Label>Offer Title (optional)</Label>
                <Input value={offerTitle} onChange={e => setOfferTitle(e.target.value)} placeholder={discountValue.includes("%") ? `Get ${discountValue} OFF your order` : `Enjoy a ${discountValue}`} />
              </div>
              <div>
                <Label>Offer Description</Label>
                <Input value={offerDescription} onChange={e => setOfferDescription(e.target.value)} />
              </div>
              <div>
                <Label>Number of Coupons</Label>
                <Input type="number" value={count} onChange={e => setCount(Number(e.target.value))} min={1} max={500} />
              </div>
              <Button onClick={handleGenerate} disabled={generating} className="w-full gradient-cafe text-primary-foreground shadow-cafe">
                {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <QrCode className="w-4 h-4 mr-2" />}
                {generating ? "Generating..." : `Generate ${count} Coupons`}
              </Button>
            </div>
          </div>
        )}

        {/* List Tab */}
        {tab === "list" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-foreground">Coupons</h2>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unused">Unused</SelectItem>
                    <SelectItem value="redeemed">Redeemed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={fetchCoupons}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAllQRs}>
                  <Download className="w-4 h-4 mr-1" /> Export QRs
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No coupons found. Generate some first!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="border border-border rounded-xl bg-card p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-mono text-sm font-bold text-foreground">{coupon.coupon_code}</p>
                        <p className="text-xs text-muted-foreground">{coupon.discount_value.includes("%") ? `${coupon.discount_value} OFF` : coupon.discount_value}</p>
                      </div>
                      {statusBadge(coupon.status)}
                    </div>
                    <div className="flex justify-center my-3 bg-secondary/50 rounded-lg p-3">
                      <QRCodeSVG
                        value={`${baseUrl}/promo/redeem?token=${coupon.token}`}
                        size={120}
                        level="H"
                        fgColor={coupon.status === "unused" ? "#fc6719" : "#999"}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {new Date(coupon.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex gap-1">
                        {coupon.status === "unused" && (
                          <Button variant="ghost" size="sm" onClick={() => downloadQR(coupon)}>
                            <Download className="w-3 h-3 mr-1" /> Save
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(coupon.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {tab === "analytics" && (
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-6">Analytics</h2>
            {stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Coupons", value: stats.total, icon: Package, color: "text-foreground" },
                  { label: "Unused", value: stats.unused, icon: Clock, color: "text-success" },
                  { label: "Redeemed", value: stats.redeemed, icon: CheckCircle, color: "text-primary" },
                  { label: "Conversion", value: `${stats.conversion_rate}%`, icon: BarChart3, color: "text-primary" },
                ].map((s, i) => (
                  <div key={i} className="border border-border rounded-xl bg-card p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                      <span className="text-sm text-muted-foreground">{s.label}</span>
                    </div>
                    <p className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
