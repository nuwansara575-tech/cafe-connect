import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  offer: string;
  start_date: string;
  end_date: string | null;
  status: string;
  created_at: string;
  coupon_count?: number;
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [offer, setOffer] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    if (data) {
      // Get coupon counts per campaign
      const { data: counts } = await supabase.from("coupons").select("campaign_id");
      const countMap: Record<string, number> = {};
      counts?.forEach(c => {
        if (c.campaign_id) countMap[c.campaign_id] = (countMap[c.campaign_id] || 0) + 1;
      });
      setCampaigns(data.map(c => ({ ...c, coupon_count: countMap[c.id] || 0 })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => {
    setEditing(null);
    setName(""); setDescription(""); setOffer(""); setStartDate(""); setEndDate("");
    setDialogOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setName(c.name);
    setDescription(c.description || "");
    setOffer(c.offer);
    setStartDate(c.start_date);
    setEndDate(c.end_date || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name || !offer) { toast.error("Name and offer are required"); return; }
    setSaving(true);
    const payload = {
      name, description: description || null, offer,
      start_date: startDate || new Date().toISOString().split("T")[0],
      end_date: endDate || null,
    };

    if (editing) {
      const { error } = await supabase.from("campaigns").update(payload).eq("id", editing.id);
      if (error) { toast.error("Failed to update"); setSaving(false); return; }
      toast.success("Campaign updated");
    } else {
      const { error } = await supabase.from("campaigns").insert(payload);
      if (error) { toast.error("Failed to create"); setSaving(false); return; }
      toast.success("Campaign created");
    }
    setSaving(false);
    setDialogOpen(false);
    fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    await supabase.from("campaigns").delete().eq("id", id);
    toast.success("Campaign deleted");
    fetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-foreground">Campaigns</h1>
        <Button onClick={openCreate} className="gradient-cafe text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> New Campaign
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : campaigns.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No campaigns yet. Create your first one!</CardContent></Card>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Offer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Coupons</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.offer}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "active" ? "default" : "secondary"}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{c.coupon_count}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.start_date}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.end_date || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Campaign" : "New Campaign"}</DialogTitle>
            <DialogDescription>Fill in the campaign details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Campaign Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label>Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div><Label>Offer (e.g. 15% OFF)</Label><Input value={offer} onChange={e => setOffer(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div><Label>End Date</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gradient-cafe text-primary-foreground">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
