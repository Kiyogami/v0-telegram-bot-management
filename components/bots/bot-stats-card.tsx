"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { BarChart3, TrendingUp, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

interface BotStats {
  totalMessages: number
  successfulMessages: number
  failedMessages: number
  successRate: number
}

interface BotStatsCardProps {
  botId: string
}

export function BotStatsCard({ botId }: BotStatsCardProps) {
  const [stats, setStats] = useState<BotStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/telegram/bot/stats?botId=${botId}`)
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("[v0] Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Odświeżaj co 30s

    return () => clearInterval(interval)
  }, [botId])

  if (loading) {
    return (
      <Card className="p-4 glass border-border/50">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Ładowanie statystyk...
        </div>
      </Card>
    )
  }

  if (!stats) return null

  return (
    <Card className="p-4 glass border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="size-4 text-primary" />
        <h3 className="font-medium">Statystyki</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Wysłane</p>
          <p className="text-2xl font-bold">{stats.totalMessages}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="size-3" />
            Udane
          </p>
          <p className="text-2xl font-bold text-green-500">{stats.successfulMessages}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="size-3" />
            Błędy
          </p>
          <p className="text-2xl font-bold text-red-500">{stats.failedMessages}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="size-3" />
            Skuteczność
          </p>
          <p className="text-2xl font-bold text-primary">{stats.successRate.toFixed(1)}%</p>
        </div>
      </div>
    </Card>
  )
}
