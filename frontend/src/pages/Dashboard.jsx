import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  LayoutDashboard,
  TrendingUp,
  Target,
  PlusCircle,
  ChevronRight,
  Loader2,
  Calendar,
  BookOpen
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Dashboard() {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        navigate("/login");
        return;
      }

      try {
        const response = await api.get(`/api/trades?userId=${userId}`);
        setTrades(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch dashboard trades:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [navigate]);

  // Calculations
  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.result?.toLowerCase() === "win").length;
  const losses = trades.filter(
    (t) => t.result?.toLowerCase() === "loss",
  ).length;
  const breakEvens = trades.filter(
    (t) => t.result?.toLowerCase() === "be",
  ).length;

  const netR = trades.reduce(
    (acc, t) => acc + parseFloat(t.r_multiple || 0),
    0,
  );
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  const getResultBadge = (result) => {
    const res = result?.toLowerCase();
    if (res === "win")
      return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400">WIN</Badge>;
    if (res === "loss")
      return <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/25 dark:text-red-400">LOSS</Badge>;
    return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400">BE</Badge>;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl shadow-sm border border-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Overview of your trading performance and recent activity.
            </p>
          </div>
        </div>
        <Button onClick={() => navigate("/add-trade")} className="gap-2 rounded-xl h-12 px-6">
          <PlusCircle className="w-5 h-5" /> Add Trade
        </Button>
      </div>

      {loading ? (
        <Card className="flex flex-col items-center justify-center h-64 shadow-sm border-border">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground text-sm font-medium">
            Loading statistics...
          </p>
        </Card>
      ) : (
        <>
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="shadow-sm rounded-2xl border-border bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-2">
                <CardDescription className="font-semibold uppercase tracking-wider text-xs">Total Trades</CardDescription>
                <CardTitle className="text-4xl">{totalTrades}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="shadow-sm rounded-2xl border-border bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-2">
                <CardDescription className="font-semibold uppercase tracking-wider text-xs">Net R-Multiple</CardDescription>
                <CardTitle className={`text-4xl ${netR >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                  {netR >= 0 ? "+" : ""}
                  {netR.toFixed(2)}R
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="shadow-sm rounded-2xl border-border bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-2">
                <CardDescription className="font-semibold uppercase tracking-wider text-xs">Win Rate</CardDescription>
                <CardTitle className="text-4xl">{winRate.toFixed(1)}%</CardTitle>
              </CardHeader>
            </Card>

            <Card className="shadow-sm rounded-2xl border-border bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-2">
                <CardDescription className="font-semibold uppercase tracking-wider text-xs">W / L / BE</CardDescription>
                <CardTitle className="text-4xl">{wins} / {losses} / {breakEvens}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Recent Trades & Quick Actions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Trades Table */}
            <Card className="lg:col-span-2 shadow-sm rounded-2xl border-border flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Recent Trades</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/trades")} className="text-primary hover:text-primary hover:bg-primary/10 gap-1 rounded-lg">
                  View All <ChevronRight className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                {trades.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-sm">
                    No trades recorded yet. Click "Add Trade" to start your journal!
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Asset</TableHead>
                        <TableHead className="font-semibold">Setup</TableHead>
                        <TableHead className="font-semibold">Result</TableHead>
                        <TableHead className="font-semibold text-right">R</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades.slice(0, 5).map((t, i) => {
                        const r = parseFloat(t.r_multiple || 0);
                        return (
                          <TableRow
                            key={i}
                            onClick={() => navigate("/trades")}
                            className="cursor-pointer transition-colors hover:bg-muted/50"
                          >
                            <TableCell className="text-muted-foreground font-medium">{t.date}</TableCell>
                            <TableCell className="font-bold">{t.asset}</TableCell>
                            <TableCell className="text-muted-foreground">{t.setup}</TableCell>
                            <TableCell>{getResultBadge(t.result)}</TableCell>
                            <TableCell className={`text-right font-bold ${r >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                              {r >= 0 ? "+" : ""}
                              {r.toFixed(2)}R
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Panel */}
            <Card className="shadow-sm rounded-2xl border-border flex flex-col justify-between overflow-hidden">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Button variant="outline" className="w-full justify-between h-14 rounded-xl border-border/50 hover:bg-muted/50 shadow-sm" onClick={() => navigate("/add-trade")}>
                  <div className="flex items-center gap-3">
                    <PlusCircle className="w-5 h-5 text-primary" />
                    <span>Record New Trade</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="outline" className="w-full justify-between h-14 rounded-xl border-border/50 hover:bg-muted/50 shadow-sm" onClick={() => navigate("/calendar")}>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span>Economic Calendar</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="outline" className="w-full justify-between h-14 rounded-xl border-border/50 hover:bg-muted/50 shadow-sm" onClick={() => navigate("/trades")}>
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span>View Past Trades</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              </CardContent>

              <div className="p-4 bg-primary/5 border-t border-border/50">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
                  Pro Tip
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Consistent journaling with psychology tracking leads to
                  sustainable edge. Log your emotional state every time!
                </p>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
