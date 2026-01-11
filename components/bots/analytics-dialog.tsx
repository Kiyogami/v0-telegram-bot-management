"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BarChart3, TrendingUp, Users, MessageSquare } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface AnalyticsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bots: any[]
}

export function AnalyticsDialog({ open, onOpenChange, bots }: AnalyticsDialogProps) {
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    // Generate mock data based on bots
    const data = bots.slice(0, 7).map((bot, index) => ({
      name: bot.name.slice(0, 10),
      wiadomosci: Math.floor(Math.random() * 1000) + 100,
      sukces: Math.floor(Math.random() * 90) + 10,
      grupy: Math.floor(Math.random() * 50) + 5,
    }))
    setChartData(data)
  }, [bots])

  const totalMessages = chartData.reduce((sum, item) => sum + item.wiadomosci, 0)
  const avgSuccess =
    chartData.length > 0 ? Math.round(chartData.reduce((sum, item) => sum + item.sukces, 0) / chartData.length) : 0
  const totalGroups = chartData.reduce((sum, item) => sum + item.grupy, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border/50 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" />
            Analityka i Statystyki
          </DialogTitle>
          <DialogDescription>Przegląd wydajności i aktywności wszystkich botów</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass rounded-lg border border-border/50 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageSquare className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalMessages}</p>
                  <p className="text-xs text-muted-foreground">Wiadomości wysłane</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-lg border border-border/50 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="size-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{avgSuccess}%</p>
                  <p className="text-xs text-muted-foreground">Średni sukces</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-lg border border-border/50 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="size-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalGroups}</p>
                  <p className="text-xs text-muted-foreground">Aktywne grupy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart - Messages per Bot */}
          <div className="glass rounded-lg border border-border/50 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Wiadomości na bota</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="wiadomosci" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart - Success Rate */}
          <div className="glass rounded-lg border border-border/50 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Wskaźnik sukcesu (%)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sukces"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                  name="Sukces (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
