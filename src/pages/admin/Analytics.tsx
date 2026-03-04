import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TicketCheck, ScanLine, Gift, Users, TrendingUp, Eye } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = [
  "hsl(142, 76%, 36%)",
  "hsl(210, 80%, 55%)",
  "hsl(22, 97%, 54%)",
  "hsl(45, 90%, 50%)",
  "hsl(0, 0%, 60%)",
];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Unused: <TicketCheck className="w-4 h-4" />,
  Scanned: <ScanLine className="w-4 h-4" />,
  Claimed: <Gift className="w-4 h-4" />,
  Redeemed: <Eye className="w-4 h-4" />,
  Expired: <TrendingUp className="w-4 h-4" />,
};

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);
  const [dailyRedemptions, setDailyRedemptions] = useState<{ date: string; count: number }[]>([]);
  const [dailyClaims, setDailyClaims] = useState<{ date: string; count: number }[]>([]);
  const [campaignData, setCampaignData] = useState<{ name: string; coupons: number; claimed: number; redeemed: number }[]>([]);
  const [totalCoupons, setTotalCoupons] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: coupons } = await supabase.from("coupons").select("status, campaign_name, redeemed_at, claimed_at");
      const { count: customerCount } = await supabase.from("customers").select("*", { count: "exact", head: true });

      const statuses = { unused: 0, scanned: 0, claimed: 0, redeemed: 0, expired: 0 };
      const campMap: Record<string, { coupons: number; claimed: number; redeemed: number }> = {};
      const redeemDayMap: Record<string, number> = {};
      const claimDayMap: Record<string, number> = {};

      coupons?.forEach(c => {
        statuses[c.status as keyof typeof statuses] = (statuses[c.status as keyof typeof statuses] || 0) + 1;

        const cn = c.campaign_name || "Unknown";
        if (!campMap[cn]) campMap[cn] = { coupons: 0, claimed: 0, redeemed: 0 };
        campMap[cn].coupons++;
        if (c.status === "claimed" || c.status === "redeemed") campMap[cn].claimed++;
        if (c.status === "redeemed") campMap[cn].redeemed++;

        if (c.redeemed_at) {
          const d = new Date(c.redeemed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          redeemDayMap[d] = (redeemDayMap[d] || 0) + 1;
        }
        if (c.claimed_at) {
          const d = new Date(c.claimed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          claimDayMap[d] = (claimDayMap[d] || 0) + 1;
        }
      });

      setTotalCoupons(coupons?.length || 0);
      setTotalCustomers(customerCount || 0);
      setStatusData([
        { name: "Unused", value: statuses.unused },
        { name: "Scanned", value: statuses.scanned },
        { name: "Claimed", value: statuses.claimed },
        { name: "Redeemed", value: statuses.redeemed },
        { name: "Expired", value: statuses.expired },
      ]);
      setDailyRedemptions(Object.entries(redeemDayMap).map(([date, count]) => ({ date, count })));
      setDailyClaims(Object.entries(claimDayMap).map(([date, count]) => ({ date, count })));
      setCampaignData(Object.entries(campMap).map(([name, v]) => ({ name, ...v })));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const totalRedeemed = statusData.find(s => s.name === "Redeemed")?.value || 0;
  const totalClaimed = statusData.find(s => s.name === "Claimed")?.value || 0;
  const conversionRate = totalCoupons > 0 ? ((totalRedeemed / totalCoupons) * 100).toFixed(1) : "0";
  const claimRate = totalCoupons > 0 ? (((totalClaimed + totalRedeemed) / totalCoupons) * 100).toFixed(1) : "0";

  const kpiCards = [
    { label: "Total Coupons", value: totalCoupons, icon: TicketCheck, color: "text-primary" },
    { label: "Total Claimed", value: totalClaimed + totalRedeemed, icon: Gift, color: "text-blue-500" },
    { label: "Total Redeemed", value: totalRedeemed, icon: Eye, color: "text-orange-500" },
    { label: "Total Customers", value: totalCustomers, icon: Users, color: "text-emerald-500" },
    { label: "Claim Rate", value: `${claimRate}%`, icon: TrendingUp, color: "text-amber-500" },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp, color: "text-violet-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Overview of coupon performance and campaign metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Coupon Status Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">Distribution of all coupons by current status</p>
          </CardHeader>
          <CardContent>
            {totalCoupons > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData.filter(s => s.value > 0)}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent, x, y, textAnchor }) => (
                      <text x={x} y={y} textAnchor={textAnchor} fill="hsl(var(--foreground))" fontSize={10} fontWeight={500}>
                        {`${name} ${(percent * 100).toFixed(0)}%`}
                      </text>
                    )}
                    labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={entry.name} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [value, "Coupons"]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <TicketCheck className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No coupon data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Claims Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Daily Claims</CardTitle>
            <p className="text-xs text-muted-foreground">Number of coupons claimed per day</p>
          </CardHeader>
          <CardContent>
            {dailyClaims.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dailyClaims} barCategoryGap="20%">
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
                  <Bar dataKey="count" fill="hsl(210, 80%, 55%)" radius={[6, 6, 0, 0]} name="Claims" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Gift className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No claim data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Redemptions Line Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Daily Redemptions</CardTitle>
            <p className="text-xs text-muted-foreground">Number of coupons redeemed per day</p>
          </CardHeader>
          <CardContent>
            {dailyRedemptions.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dailyRedemptions}>
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
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", r: 4 }} activeDot={{ r: 6 }} name="Redemptions" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Eye className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No redemption data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Campaign Comparison</CardTitle>
            <p className="text-xs text-muted-foreground">Total vs claimed vs redeemed per campaign</p>
          </CardHeader>
          <CardContent>
            {campaignData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={campaignData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="coupons" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]} name="Total" opacity={0.4} />
                  <Bar dataKey="claimed" fill="hsl(210, 80%, 55%)" radius={[6, 6, 0, 0]} name="Claimed" />
                  <Bar dataKey="redeemed" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Redeemed" />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <ScanLine className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No campaign data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Legend Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {statusData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
                <div>
                  <p className="text-xs text-muted-foreground">{s.name}</p>
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
