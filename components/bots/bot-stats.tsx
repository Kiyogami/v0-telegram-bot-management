"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart, TrendingUp, AlertCircle, Clock } from "lucide-react"

interface BotStatsProps {
  botId: string
}

interface Stats {
  totalMessages: number
  failedMessages: number
  groupCount: number
  lastMessageTime: string | null
  successRate: string
}

export function BotStats({ botId }: BotStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/telegram/bot/stats?botId=${botId}`)
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("[v0] Stats fetch error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [botId])

  if (loading) return <div className="text-muted-foreground text-sm">Ładowanie...</div>

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card className="glass border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Wysłane</p>
              <p className="text-lg font-bold text-foreground">{stats?.totalMessages || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Błędy</p>
              <p className="text-lg font-bold text-foreground">{stats?.failedMessages || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <BarChart className="size-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Grupy</p>
              <p className="text-lg font-bold text-foreground">{stats?.groupCount || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Powodzenie</p>
              <p className="text-lg font-bold text-foreground">{stats?.successRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
