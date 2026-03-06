import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Loader2, Plus, Star, RefreshCw } from "lucide-react";

interface Member {
  id: string;
  customer_id: string;
  total_points: number;
  tier: string;
  total_visits: number;
  total_rewards_redeemed: number;
  last_activity: string | null;
  customer_name: string;
  customer_phone: string;
}

interface PointRule {
  id: string;
  rule_name: string;
  points: number;
  is_active: boolean;
}

export default function LoyaltyMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [rules, setRules] = useState<PointRule[]>([]);

  // Add points dialog
  const [showAdd, setShowAdd] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedRule, setSelectedRule] = useState("");
  const [customPoints, setCustomPoints] = useState("");
  const [customSource, setCustomSource] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Enroll dialog
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollSearch, setEnrollSearch] = useState("");
  const [enrollResults, setEnrollResults] = useState<{ id: string; name: string; mobile_number: string }[]>([]);
  const [enrolling, setEnrolling] = useState(false);

  // New customer form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, custRes] = await Promise.all([
        supabase.from("loyalty_accounts").select("*").order("total_points", { ascending: false }),
        supabase.from("customers").select("id, name, mobile_number"),
      ]);
      const customers = new Map((custRes.data || []).map(c => [c.id, c]));
      setMembers((accRes.data || []).map(a => {
        const c = customers.get(a.customer_id);
        return { ...a, customer_name: c?.name || "Unknown", customer_phone: c?.mobile_number || "" };
      }));
    } catch { toast.error("Failed to load members"); }
    setLoading(false);
  }, []);

  const loadRules = useCallback(async () => {
    const { data } = await supabase.from("loyalty_point_rules").select("*").eq("is_active", true);
    setRules(data || []);
  }, []);

  useEffect(() => { loadMembers(); loadRules(); }, [loadMembers, loadRules]);

  const filtered = members.filter(m =>
    m.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    m.customer_phone.includes(search)
  );

  const handleAddPoints = async () => {
    if (!selectedMember) return;
    const rule = rules.find(r => r.id === selectedRule);
    const pts = rule ? rule.points : parseInt(customPoints);
    const src = rule ? rule.rule_name : customSource;
    if (!pts || pts <= 0) { toast.error("Invalid points"); return; }

    setSubmitting(true);
    try {
      await supabase.from("loyalty_transactions").insert({
        customer_id: selectedMember.customer_id,
        points: pts,
        type: "earn",
        source: src,
        description: `${pts} points earned via ${src}`,
      });
      await supabase.from("loyalty_accounts").update({
        total_points: selectedMember.total_points + pts,
        total_visits: selectedMember.total_visits + 1,
        last_activity: new Date().toISOString(),
      }).eq("id", selectedMember.id);

      toast.success(`${pts} points added to ${selectedMember.customer_name}`);
      setShowAdd(false);
      setSelectedRule("");
      setCustomPoints("");
      setCustomSource("");
      loadMembers();
    } catch { toast.error("Failed to add points"); }
    setSubmitting(false);
  };

  const searchCustomers = async () => {
    if (!enrollSearch.trim()) return;
    const { data } = await supabase.from("customers").select("id, name, mobile_number")
      .or(`name.ilike.%${enrollSearch}%,mobile_number.ilike.%${enrollSearch}%`);
    const existingIds = new Set(members.map(m => m.customer_id));
    setEnrollResults((data || []).filter(c => !existingIds.has(c.id)));
  };

  const enrollCustomer = async (customerId: string) => {
    setEnrolling(true);
    try {
      await supabase.from("loyalty_accounts").insert({ customer_id: customerId });
      toast.success("Customer enrolled in loyalty program!");
      setShowEnroll(false);
      setEnrollSearch("");
      setEnrollResults([]);
      setShowNewForm(false);
      loadMembers();
    } catch { toast.error("Failed to enroll customer"); }
    setEnrolling(false);
  };

  const createAndEnroll = async () => {
    if (!newName.trim() || !newPhone.trim()) { toast.error("Name and phone are required"); return; }
    setCreatingCustomer(true);
    try {
      const { data: existing } = await supabase.from("customers").select("id").eq("mobile_number", newPhone.trim()).maybeSingle();
      if (existing) {
        const { data: alreadyEnrolled } = await supabase.from("loyalty_accounts").select("id").eq("customer_id", existing.id).maybeSingle();
        if (alreadyEnrolled) { toast.error("This customer is already enrolled"); setCreatingCustomer(false); return; }
        await enrollCustomer(existing.id);
        setCreatingCustomer(false);
        return;
      }
      const { data: newCust, error } = await supabase.from("customers").insert({ name: newName.trim(), mobile_number: newPhone.trim() }).select("id").single();
      if (error || !newCust) { toast.error("Failed to create customer"); setCreatingCustomer(false); return; }
      await enrollCustomer(newCust.id);
    } catch { toast.error("Failed to create customer"); }
    setCreatingCustomer(false);
  };

  const tierColor = (tier: string) => {
    switch (tier) {
      case "Gold": return "bg-amber-100 text-amber-800 border-amber-300";
      case "Silver": return "bg-gray-100 text-gray-800 border-gray-300";
      default: return "bg-orange-100 text-orange-800 border-orange-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Loyalty Members</h1>
          <p className="text-muted-foreground text-sm">{members.length} enrolled members</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadMembers}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
          <Button size="sm" onClick={() => setShowEnroll(true)}><Plus className="w-4 h-4 mr-1" /> Enroll Customer</Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No members found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Visits</TableHead>
                    <TableHead>Rewards</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.customer_name}</TableCell>
                      <TableCell className="text-muted-foreground">{m.customer_phone}</TableCell>
                      <TableCell><span className="font-bold text-primary">{m.total_points}</span></TableCell>
                      <TableCell><Badge variant="outline" className={tierColor(m.tier)}>{m.tier}</Badge></TableCell>
                      <TableCell>{m.total_visits}</TableCell>
                      <TableCell>{m.total_rewards_redeemed}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedMember(m); setShowAdd(true); }}>
                          <Star className="w-3 h-3 mr-1" /> Add Points
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Points Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Points — {selectedMember?.customer_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Select Rule</label>
              <Select value={selectedRule} onValueChange={v => { setSelectedRule(v); setCustomPoints(""); }}>
                <SelectTrigger><SelectValue placeholder="Choose a point rule..." /></SelectTrigger>
                <SelectContent>
                  {rules.map(r => <SelectItem key={r.id} value={r.id}>{r.rule_name} (+{r.points} pts)</SelectItem>)}
                  <SelectItem value="custom">Custom Points</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedRule === "custom" && (
              <>
                <Input type="number" placeholder="Points" value={customPoints} onChange={e => setCustomPoints(e.target.value)} />
                <Input placeholder="Source / Reason" value={customSource} onChange={e => setCustomSource(e.target.value)} />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAddPoints} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Points"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll Customer Dialog */}
      <Dialog open={showEnroll} onOpenChange={v => { setShowEnroll(v); if (!v) { setShowNewForm(false); setNewName(""); setNewPhone(""); setEnrollSearch(""); setEnrollResults([]); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enroll Customer in Loyalty</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!showNewForm ? (
              <>
                <div className="flex gap-2">
                  <Input placeholder="Search by name or phone..." value={enrollSearch} onChange={e => setEnrollSearch(e.target.value)} />
                  <Button onClick={searchCustomers}>Search</Button>
                </div>
                {enrollResults.length > 0 && (
                  <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                    {enrollResults.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3">
                        <div><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.mobile_number}</p></div>
                        <Button size="sm" onClick={() => enrollCustomer(c.id)} disabled={enrolling}>Enroll</Button>
                      </div>
                    ))}
                  </div>
                )}
                {enrollResults.length === 0 && enrollSearch && <p className="text-sm text-muted-foreground text-center">No unenrolled customers found</p>}
                <div className="border-t pt-3">
                  <Button variant="outline" className="w-full" onClick={() => setShowNewForm(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Create New Customer & Enroll
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <Input placeholder="Customer name" value={newName} onChange={e => setNewName(e.target.value)} />
                <Input placeholder="Mobile number" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowNewForm(false)}>Back</Button>
                  <Button className="flex-1" onClick={createAndEnroll} disabled={creatingCustomer}>
                    {creatingCustomer ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create & Enroll"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
