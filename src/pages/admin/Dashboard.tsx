import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package, CheckCircle, Clock, BarChart3, ScanLine, HandCoins, UserCheck, TrendingUp, TrendingDown, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface Stats {
  total: number;
  redeemed: number;
  claimed: number;
  scanned: number;
  unused: number;
  expired: number;
  conversion_rate: string;
  claim_rate: string;
  totalScans: number;
  totalCustomers: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [dailyScans, setDailyScans] = useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: coupons } = await supabase.from("coupons").select("status");
      const total = coupons?.length || 0;
      const redeemed = coupons?.filter(c => c.status === "redeemed").length || 0;
      const claimed = coupons?.filter(c => c.status === "claimed").length || 0;
      const scanned = coupons?.filter(c => c.status === "scanned").length || 0;
      const unused = coupons?.filter(c => c.status === "unused").length || 0;
      const expired = coupons?.filter(c => c.status === "expired").length || 0;

      const { count: scanCount } = await supabase.from("scans").select("*", { count: "exact", head: true });
      const { count: customerCount } = await supabase.from("customers").select("*", { count: "exact", head: true });

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
        total, redeemed, claimed, scanned, unused, expired,
        conversion_rate: total > 0 ? ((redeemed / total) * 100).toFixed(1) : "0",
        claim_rate: total > 0 ? (((claimed + redeemed) / total) * 100).toFixed(1) : "0",
        totalScans: scanCount || 0,
        totalCustomers: customerCount || 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const primaryCards = [
    {
      label: "Total Coupons",
      value: stats!.total,
      description: "All generated coupons",
      icon: Package,
      gradient: "from-primary/10 to-primary/5",
      iconBg: "bg-primary/15",
      iconColor: "text-primary",
    },
    {
      label: "Total Customers",
      value: stats!.totalCustomers,
      description: "Registered customers",
      icon: Users,
      gradient: "from-emerald-500/10 to-emerald-500/5",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-500",
    },
    {
      label: "Total Scans",
      value: stats!.totalScans,
      description: "QR code scans recorded",
      icon: ScanLine,
      gradient: "from-violet-500/10 to-violet-500/5",
      iconBg: "bg-violet-500/15",
      iconColor: "text-violet-500",
    },
    {
      label: "Claim Rate",
      value: `${stats!.claim_rate}%`,
      description: "Claimed + redeemed / total",
      icon: TrendingUp,
      gradient: "from-blue-500/10 to-blue-500/5",
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-500",
    },
  ];

  const statusCards = [
    { label: "Unused", value: stats!.unused, icon: Clock, color: "bg-emerald-500" },
    { label: "Scanned", value: stats!.scanned, icon: ScanLine, color: "bg-violet-500" },
    { label: "Claimed", value: stats!.claimed, icon: UserCheck, color: "bg-blue-500" },
    { label: "Redeemed", value: stats!.redeemed, icon: CheckCircle, color: "bg-primary" },
    { label: "Expired", value: stats!.expired, icon: TrendingDown, color: "bg-muted-foreground" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here's a quick overview of your coupon performance.</p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryCards.map((c) => (
          <Card key={c.label} className={`relative overflow-hidden glass border-border/40 bg-gradient-to-br ${c.gradient}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{c.label}</p>
                  <p className="text-3xl font-display font-bold text-foreground">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                </div>
                <div className={`${c.iconBg} rounded-xl p-2.5`}>
                  <c.icon className={`w-5 h-5 ${c.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Breakdown */}
      <Card className="glass-strong border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Coupon Status Breakdown</CardTitle>
          <p className="text-xs text-muted-foreground">Current distribution of all coupons by status</p>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          {stats!.total > 0 ? (
            <div className="space-y-4">
              <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                {statusCards.map((s) => {
                  const pct = stats!.total > 0 ? (s.value / stats!.total) * 100 : 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={s.label}
                      className={`${s.color} transition-all`}
                      style={{ width: `${pct}%` }}
                      title={`${s.label}: ${s.value} (${pct.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {statusCards.map((s) => {
                  const pct = stats!.total > 0 ? ((s.value / stats!.total) * 100).toFixed(1) : "0";
                  return (
                    <div key={s.label} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.color}`} />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-foreground">{s.value}</span>
                          <span className="text-xs text-muted-foreground">({pct}%)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No coupons generated yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rates + Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rates Column */}
        <div className="space-y-4">
          <Card className="glass border-border/40">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <HandCoins className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Claim Rate</span>
              </div>
              <p className="text-4xl font-display font-bold text-foreground mt-2">{stats!.claim_rate}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats!.claimed + stats!.redeemed} of {stats!.total} coupons claimed
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-border/40">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Redemption Rate</span>
              </div>
              <p className="text-4xl font-display font-bold text-foreground mt-2">{stats!.conversion_rate}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats!.redeemed} of {stats!.total} coupons redeemed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="lg:col-span-2 glass-strong border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Daily Scans — Last 14 Days</CardTitle>
            <p className="text-xs text-muted-foreground">QR code scan activity over the past two weeks</p>
          </CardHeader>
          <CardContent>
            {dailyScans.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={dailyScans}>
                  <defs>
                    <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#scanGradient)" dot={{ fill: "hsl(var(--primary))", r: 3 }} activeDot={{ r: 5 }} name="Scans" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <ScanLine className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No scan data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
