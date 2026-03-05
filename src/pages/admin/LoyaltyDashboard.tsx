import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Star, Gift, TrendingUp, Award } from "lucide-react";
import { Loader2 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import { format, subDays } from "date-fns";

interface Stats {
  totalMembers: number;
  totalPointsIssued: number;
  totalRewardsRedeemed: number;
  totalVisits: number;
}

interface TopCustomer {
  name: string;
  mobile: string;
  points: number;
  tier: string;
}

export default function LoyaltyDashboard() {
  const [stats, setStats] = useState<Stats>({ totalMembers: 0, totalPointsIssued: 0, totalRewardsRedeemed: 0, totalVisits: 0 });
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [activityData, setActivityData] = useState<{ date: string; earned: number; redeemed: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [accountsRes, txRes, customersRes] = await Promise.all([
          supabase.from("loyalty_accounts").select("total_points, total_visits, total_rewards_redeemed, customer_id"),
          supabase.from("loyalty_transactions").select("points, type, created_at"),
          supabase.from("customers").select("id, name, mobile_number"),
        ]);

        const accounts = accountsRes.data || [];
        const transactions = txRes.data || [];
        const customers = customersRes.data || [];

        const totalMembers = accounts.length;
        const totalPointsIssued = transactions.filter(t => t.type === "earn").reduce((s, t) => s + t.points, 0);
        const totalRewardsRedeemed = accounts.reduce((s, a) => s + a.total_rewards_redeemed, 0);
        const totalVisits = accounts.reduce((s, a) => s + a.total_visits, 0);

        setStats({ totalMembers, totalPointsIssued, totalRewardsRedeemed, totalVisits });

        // Top customers
        const customerMap = new Map(customers.map(c => [c.id, c]));
        const sorted = [...accounts].sort((a, b) => b.total_points - a.total_points).slice(0, 5);
        setTopCustomers(sorted.map(a => {
          const c = customerMap.get(a.customer_id);
          return { name: c?.name || "Unknown", mobile: c?.mobile_number || "", points: a.total_points, tier: "Bronze" };
        }));

        // Activity chart - last 14 days
        const days = Array.from({ length: 14 }, (_, i) => format(subDays(new Date(), 13 - i), "yyyy-MM-dd"));
        const dayMap = new Map(days.map(d => [d, { earned: 0, redeemed: 0 }]));
        transactions.forEach(t => {
          const d = format(new Date(t.created_at), "yyyy-MM-dd");
          const entry = dayMap.get(d);
          if (entry) {
            if (t.type === "earn") entry.earned += t.points;
            else entry.redeemed += t.points;
          }
        });
        setActivityData(days.map(d => ({ date: format(new Date(d), "MMM dd"), ...dayMap.get(d)! })));
      } catch (err) {
        console.error("Failed to load loyalty stats:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const kpis = [
    { label: "Loyalty Members", value: stats.totalMembers, icon: Users, color: "text-primary" },
    { label: "Points Issued", value: stats.totalPointsIssued.toLocaleString(), icon: Star, color: "text-amber-500" },
    { label: "Rewards Redeemed", value: stats.totalRewardsRedeemed, icon: Gift, color: "text-emerald-500" },
    { label: "Total Visits", value: stats.totalVisits, icon: TrendingUp, color: "text-blue-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Loyalty Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your loyalty program performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${k.color}`}><k.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-xl font-bold text-foreground">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Points Activity (14 Days)</CardTitle></CardHeader>
          <CardContent>
            {activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Area type="monotone" dataKey="earned" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="Earned" />
                  <Area type="monotone" dataKey="redeemed" stroke="hsl(var(--success))" fill="hsl(var(--success) / 0.2)" name="Redeemed" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No activity yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Award className="w-4 h-4 text-primary" /> Top Members</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {topCustomers.length > 0 ? topCustomers.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.mobile}</p>
                </div>
                <span className="text-sm font-bold text-primary">{c.points} pts</span>
              </div>
            )) : (
              <p className="text-muted-foreground text-sm text-center py-4">No members yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
