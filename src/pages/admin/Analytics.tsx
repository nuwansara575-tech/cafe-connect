import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["hsl(142, 76%, 36%)", "hsl(210, 80%, 55%)", "hsl(22, 97%, 54%)", "hsl(45, 90%, 50%)", "hsl(0, 0%, 60%)"];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);
  const [dailyRedemptions, setDailyRedemptions] = useState<{ date: string; count: number }[]>([]);
  const [dailyClaims, setDailyClaims] = useState<{ date: string; count: number }[]>([]);
  const [campaignData, setCampaignData] = useState<{ name: string; coupons: number; claimed: number; redeemed: number }[]>([]);

  useEffect(() => {
    async function load() {
      const { data: coupons } = await supabase.from("coupons").select("status, campaign_name, redeemed_at, claimed_at");
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-foreground">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Coupon Status Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Daily Claims</CardTitle></CardHeader>
          <CardContent>
            {dailyClaims.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyClaims}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
                  <Bar dataKey="count" fill="hsl(210, 80%, 55%)" radius={[4, 4, 0, 0]} name="Claims" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">No claim data yet</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Daily Redemptions</CardTitle></CardHeader>
          <CardContent>
            {dailyRedemptions.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyRedemptions}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">No redemption data yet</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Campaign Comparison</CardTitle></CardHeader>
          <CardContent>
            {campaignData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={campaignData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
                  <Bar dataKey="coupons" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} name="Total" />
                  <Bar dataKey="claimed" fill="hsl(210, 80%, 55%)" radius={[4, 4, 0, 0]} name="Claimed" />
                  <Bar dataKey="redeemed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Redeemed" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">No campaign data yet</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
