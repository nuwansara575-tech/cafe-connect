import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, RefreshCw, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  customer_id: string;
  points: number;
  type: string;
  source: string;
  description: string | null;
  created_at: string;
  customer_name: string;
  customer_phone: string;
}

export default function LoyaltyTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const [txRes, custRes] = await Promise.all([
      supabase.from("loyalty_transactions").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("customers").select("id, name, mobile_number"),
    ]);
    const customers = new Map((custRes.data || []).map(c => [c.id, c]));
    setTransactions((txRes.data || []).map(t => {
      const c = customers.get(t.customer_id);
      return { ...t, customer_name: c?.name || "Unknown", customer_phone: c?.mobile_number || "" };
    }));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = transactions.filter(t =>
    t.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    t.customer_phone.includes(search) ||
    t.source.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
          <p className="text-muted-foreground text-sm">All loyalty point activity</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by customer or source..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No transactions found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>
                        {t.type === "earn" ? (
                          <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                            <ArrowUpCircle className="w-3 h-3 mr-1" /> Earned
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-orange-100 text-orange-800 border-orange-300">
                            <ArrowDownCircle className="w-3 h-3 mr-1" /> Redeemed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{t.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{t.customer_phone}</p>
                      </TableCell>
                      <TableCell className={`font-bold ${t.type === "earn" ? "text-emerald-600" : "text-primary"}`}>
                        {t.type === "earn" ? "+" : "-"}{t.points}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.source}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(t.created_at), "MMM dd, yyyy HH:mm")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
