import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Search, Loader2, Gift, Star, CheckCircle2 } from "lucide-react";

interface CustomerLoyalty {
  accountId: string;
  customerId: string;
  name: string;
  phone: string;
  totalPoints: number;
  tier: string;
  totalVisits: number;
}

interface Reward {
  id: string;
  reward_name: string;
  points_required: number;
  description: string | null;
}

export default function LoyaltyRedeem() {
  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState<CustomerLoyalty | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [searching, setSearching] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState(false);

  const searchCustomer = async () => {
    if (!phone.trim()) { toast.error("Enter a mobile number"); return; }
    setSearching(true);
    setCustomer(null);
    setRedeemed(false);
    try {
      const { data: custData } = await supabase.from("customers").select("id, name, mobile_number").ilike("mobile_number", `%${phone.trim()}%`).maybeSingle();
      if (!custData) { toast.error("Customer not found"); setSearching(false); return; }

      const { data: accData } = await supabase.from("loyalty_accounts").select("*").eq("customer_id", custData.id).maybeSingle();
      if (!accData) { toast.error("Customer is not enrolled in the loyalty program"); setSearching(false); return; }

      setCustomer({
        accountId: accData.id,
        customerId: custData.id,
        name: custData.name,
        phone: custData.mobile_number,
        totalPoints: accData.total_points,
        tier: accData.tier,
        totalVisits: accData.total_visits,
      });

      const { data: rewardsData } = await supabase.from("loyalty_rewards").select("*").eq("status", "active").order("points_required", { ascending: true });
      setRewards(rewardsData || []);
    } catch { toast.error("Search failed"); }
    setSearching(false);
  };

  const handleRedeem = async (reward: Reward) => {
    if (!customer) return;
    if (customer.totalPoints < reward.points_required) { toast.error("Not enough points"); return; }

    setRedeeming(reward.id);
    try {
      // Deduct points
      const newPoints = customer.totalPoints - reward.points_required;
      await supabase.from("loyalty_accounts").update({
        total_points: newPoints,
        total_rewards_redeemed: customer.totalVisits + 1, // increment
        last_activity: new Date().toISOString(),
      }).eq("id", customer.accountId);

      // Record transaction
      await supabase.from("loyalty_transactions").insert({
        customer_id: customer.customerId,
        points: reward.points_required,
        type: "redeem",
        source: reward.reward_name,
        description: `Redeemed: ${reward.reward_name}`,
      });

      setCustomer({ ...customer, totalPoints: newPoints });
      setRedeemed(true);
      toast.success(`${reward.reward_name} redeemed successfully!`);
    } catch { toast.error("Redemption failed"); }
    setRedeeming(null);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Redeem Reward</h1>
        <p className="text-muted-foreground text-sm">Search customer by phone to redeem loyalty rewards</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter mobile number..."
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchCustomer()}
                className="pl-9"
              />
            </div>
            <Button onClick={searchCustomer} disabled={searching}>
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {customer && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" /> Customer Loyalty Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium text-foreground">{customer.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{customer.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Points Balance</p>
                  <p className="text-2xl font-bold text-primary">{customer.totalPoints}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tier</p>
                  <p className="font-medium text-foreground">{customer.tier}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" /> Available Rewards
            </h2>
            <div className="grid gap-3">
              {rewards.map(r => {
                const canRedeem = customer.totalPoints >= r.points_required;
                return (
                  <Card key={r.id} className={`transition-all ${canRedeem ? "border-primary/30" : "opacity-60"}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{r.reward_name}</p>
                        <p className="text-xs text-muted-foreground">{r.description}</p>
                        <p className="text-sm font-bold text-primary mt-1">{r.points_required} points</p>
                      </div>
                      <Button
                        size="sm"
                        disabled={!canRedeem || redeeming === r.id}
                        onClick={() => handleRedeem(r)}
                      >
                        {redeeming === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                          <><CheckCircle2 className="w-4 h-4 mr-1" /> Redeem</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
              {rewards.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No active rewards available</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
