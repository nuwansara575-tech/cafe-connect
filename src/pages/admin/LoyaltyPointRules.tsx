import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, ToggleLeft, ToggleRight, Settings2 } from "lucide-react";

interface Rule {
  id: string;
  rule_name: string;
  points: number;
  description: string | null;
  is_active: boolean;
}

export default function LoyaltyPointRules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [form, setForm] = useState({ rule_name: "", points: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadRules = async () => {
    setLoading(true);
    const { data } = await supabase.from("loyalty_point_rules").select("*").order("created_at", { ascending: true });
    setRules(data || []);
    setLoading(false);
  };

  useEffect(() => { loadRules(); }, []);

  const openCreate = () => { setEditing(null); setForm({ rule_name: "", points: "", description: "" }); setShowForm(true); };
  const openEdit = (r: Rule) => { setEditing(r); setForm({ rule_name: r.rule_name, points: String(r.points), description: r.description || "" }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.rule_name || !form.points) { toast.error("Name and points required"); return; }
    setSubmitting(true);
    const payload = { rule_name: form.rule_name, points: parseInt(form.points), description: form.description || null };
    try {
      if (editing) {
        await supabase.from("loyalty_point_rules").update(payload).eq("id", editing.id);
        toast.success("Rule updated");
      } else {
        await supabase.from("loyalty_point_rules").insert(payload);
        toast.success("Rule created");
      }
      setShowForm(false);
      loadRules();
    } catch { toast.error("Failed to save rule"); }
    setSubmitting(false);
  };

  const toggleActive = async (r: Rule) => {
    await supabase.from("loyalty_point_rules").update({ is_active: !r.is_active }).eq("id", r.id);
    toast.success(r.is_active ? "Rule deactivated" : "Rule activated");
    loadRules();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Settings2 className="w-6 h-6 text-primary" /> Point Rules</h1>
          <p className="text-muted-foreground text-sm">Configure how customers earn loyalty points</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Add Rule</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No point rules configured</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.rule_name}</TableCell>
                    <TableCell className="font-bold text-primary">+{r.points}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.description}</TableCell>
                    <TableCell>
                      <Badge variant={r.is_active ? "default" : "secondary"}>
                        {r.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleActive(r)}>
                          {r.is_active ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
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
          <DialogHeader><DialogTitle>{editing ? "Edit Rule" : "Create Rule"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Rule Name" value={form.rule_name} onChange={e => setForm(f => ({ ...f, rule_name: e.target.value }))} />
            <Input type="number" placeholder="Points" value={form.points} onChange={e => setForm(f => ({ ...f, points: e.target.value }))} />
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
