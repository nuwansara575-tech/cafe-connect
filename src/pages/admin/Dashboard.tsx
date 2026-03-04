import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package, CheckCircle, Clock, BarChart3, ScanLine } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Stats {
  total: number;
  redeemed: number;
  unused: number;
  expired: number;
  conversion_rate: string;
  totalScans: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [dailyScans, setDailyScans] = useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Fetch coupon stats
      const { data: coupons } = await supabase.from("coupons").select("status");
      const total = coupons?.length || 0;
      const redeemed = coupons?.filter(c => c.status === "redeemed").length || 0;
      const unused = coupons?.filter(c => c.status === "unused").length || 0;
      const expired = coupons?.filter(c => c.status === "expired").length || 0;

      // Fetch scan count
      const { count: scanCount } = await supabase.from("scans").select("*", { count: "exact", head: true });

      // Fetch daily scans (last 14 days)
      const since = new Date();
      since.setDate(since.getDate() - 14);
      const { data: scans } = await supabase
        .from("scans")
        .select("scan_time")
        .gte("scan_time", since.toISOString())
        .order("scan_time", { ascending: true });

      const dayMap: Record<string, number> = {};
      scans?.forEach(s => {
        const d = new Date(s.scan_time).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        dayMap[d] = (dayMap[d] || 0) + 1;
      });
      setDailyScans(Object.entries(dayMap).map(([date, count]) => ({ date, count })));

      setStats({
        total,
        redeemed,
        unused,
        expired,
        conversion_rate: total > 0 ? ((redeemed / total) * 100).toFixed(1) : "0",
        totalScans: scanCount || 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const cards = [
    { label: "Total Coupons", value: stats!.total, icon: Package, color: "text-foreground" },
    { label: "Unused", value: stats!.unused, icon: Clock, color: "text-success" },
    { label: "Redeemed", value: stats!.redeemed, icon: CheckCircle, color: "text-primary" },
    { label: "Total Scans", value: stats!.totalScans, icon: ScanLine, color: "text-foreground" },
    { label: "Conversion Rate", value: `${stats!.conversion_rate}%`, icon: BarChart3, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <c.icon className={`w-4 h-4 ${c.color}`} />
                <span className="text-xs text-muted-foreground">{c.label}</span>
              </div>
              <p className={`text-2xl font-display font-bold ${c.color}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Scans (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyScans.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyScans}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">No scan data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
