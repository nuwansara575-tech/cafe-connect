import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Gift, Pencil, ToggleLeft, ToggleRight } from "lucide-react";

interface Reward {
  id: string;
  reward_name: string;
  points_required: number;
  description: string | null;
  status: string;
  created_at: string;
}

export default function LoyaltyRewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [form, setForm] = useState({ reward_name: "", points_required: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadRewards = async () => {
    setLoading(true);
    const { data } = await supabase.from("loyalty_rewards").select("*").order("points_required", { ascending: true });
    setRewards(data || []);
    setLoading(false);
  };

  useEffect(() => { loadRewards(); }, []);

  const openCreate = () => { setEditing(null); setForm({ reward_name: "", points_required: "", description: "" }); setShowForm(true); };
  const openEdit = (r: Reward) => { setEditing(r); setForm({ reward_name: r.reward_name, points_required: String(r.points_required), description: r.description || "" }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.reward_name || !form.points_required) { toast.error("Name and points required"); return; }
    setSubmitting(true);
    const payload = { reward_name: form.reward_name, points_required: parseInt(form.points_required), description: form.description || null };
    try {
      if (editing) {
        await supabase.from("loyalty_rewards").update(payload).eq("id", editing.id);
        toast.success("Reward updated");
      } else {
        await supabase.from("loyalty_rewards").insert(payload);
        toast.success("Reward created");
      }
      setShowForm(false);
      loadRewards();
    } catch { toast.error("Failed to save reward"); }
    setSubmitting(false);
  };

  const toggleStatus = async (r: Reward) => {
    const newStatus = r.status === "active" ? "inactive" : "active";
    await supabase.from("loyalty_rewards").update({ status: newStatus }).eq("id", r.id);
    toast.success(`Reward ${newStatus}`);
    loadRewards();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Loyalty Rewards</h1>
          <p className="text-muted-foreground text-sm">Manage redeemable rewards for customers</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Add Reward</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : rewards.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No rewards configured</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reward</TableHead>
                  <TableHead>Points Required</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium flex items-center gap-2"><Gift className="w-4 h-4 text-primary" />{r.reward_name}</TableCell>
                    <TableCell className="font-bold text-primary">{r.points_required}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{r.description}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "active" ? "default" : "secondary"}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleStatus(r)}>
                          {r.status === "active" ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Reward" : "Create Reward"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Reward Name" value={form.reward_name} onChange={e => setForm(f => ({ ...f, reward_name: e.target.value }))} />
            <Input type="number" placeholder="Points Required" value={form.points_required} onChange={e => setForm(f => ({ ...f, points_required: e.target.value }))} />
            <Input placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={submitting}>{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
