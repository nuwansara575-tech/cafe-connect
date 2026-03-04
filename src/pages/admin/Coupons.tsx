import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Search, Download, RefreshCw, Loader2, Trash2, XCircle, Package } from "lucide-react";

interface Coupon {
  id: string;
  token: string;
  campaign_name: string;
  offer_title: string;
  discount_value: string;
  status: string;
  coupon_code: string;
  created_at: string;
  scanned_at: string | null;
  claimed_at: string | null;
  redeemed_at: string | null;
  customer_phone: string | null;
  customer_name: string | null;
  campaign_id: string | null;
}

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const baseUrl = window.location.origin;

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("coupons").select("*").order("created_at", { ascending: false }).limit(500);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (search.trim()) {
      query = query.or(`token.ilike.%${search}%,coupon_code.ilike.%${search}%,customer_phone.ilike.%${search}%`);
    }
    const { data } = await query;
    setCoupons((data as Coupon[]) || []);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const handleExpire = async (id: string) => {
    await supabase.from("coupons").update({ status: "expired" }).eq("id", id);
    toast.success("Coupon expired");
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    toast.success("Coupon deleted");
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  const downloadQR = async (coupon: Coupon) => {
    const div = document.createElement("div");
    div.style.padding = "20px";
    div.style.background = "white";
    div.style.display = "inline-block";
    document.body.appendChild(div);
    const { createRoot } = await import("react-dom/client");
    const root = createRoot(div);
    await new Promise<void>(resolve => {
      root.render(
        <div style={{ padding: 20, background: "white", textAlign: "center" }}>
          <QRCodeSVG value={`${baseUrl}/promo/redeem?token=${coupon.token}`} size={256} level="H" fgColor="#fc6719" />
          <p style={{ marginTop: 8, fontSize: 12, color: "#666", fontFamily: "monospace" }}>{coupon.coupon_code}</p>
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
    } catch { toast.error("Failed to download QR"); }
    root.unmount();
    document.body.removeChild(div);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "unused": return <Badge className="bg-success/10 text-success border-success/20">Unused</Badge>;
      case "scanned": return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Scanned</Badge>;
      case "claimed": return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Claimed</Badge>;
      case "redeemed": return <Badge className="bg-primary/10 text-primary border-primary/20">Redeemed</Badge>;
      case "expired": return <Badge variant="secondary">Expired</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-foreground">Coupons</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by token, code, or phone..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unused">Unused</SelectItem>
            <SelectItem value="scanned">Scanned</SelectItem>
            <SelectItem value="claimed">Claimed</SelectItem>
            <SelectItem value="redeemed">Redeemed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchCoupons}><RefreshCw className="w-4 h-4" /></Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No coupons found</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Scan</TableHead>
                <TableHead>Claimed</TableHead>
                <TableHead>Redeemed</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm font-medium">{c.coupon_code}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono max-w-[100px] truncate">{c.token}</TableCell>
                  <TableCell>{statusBadge(c.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {c.customer_phone ? (
                        <>
                          <p className="font-medium">{c.customer_phone}</p>
                          {c.customer_name && <p className="text-xs text-muted-foreground">{c.customer_name}</p>}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{c.discount_value}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.scanned_at ? new Date(c.scanned_at).toLocaleString() : "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.claimed_at ? new Date(c.claimed_at).toLocaleString() : "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.redeemed_at ? new Date(c.redeemed_at).toLocaleString() : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {["unused", "scanned"].includes(c.status) && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => downloadQR(c)} title="Download QR"><Download className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleExpire(c.id)} title="Expire"><XCircle className="w-4 h-4 text-muted-foreground" /></Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(c.id)} title="Delete"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
