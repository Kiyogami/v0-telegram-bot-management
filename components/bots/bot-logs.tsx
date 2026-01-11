"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, Clock } from "lucide-react"

interface Log {
  id: string
  message_text: string
  group_id: number
  status: "sent" | "failed" | "pending"
  error_message: string | null
  sent_at: string | null
  created_at: string
}

interface BotLogsProps {
  botId: string
}

export function BotLogs({ botId }: BotLogsProps) {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/telegram/bot/logs?botId=${botId}&limit=20`)
        const data = await response.json()
        setLogs(data.logs || [])
      } catch (error) {
        console.error("[v0] Logs fetch error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 5000)
    return () => clearInterval(interval)
  }, [botId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle2 className="size-4 text-green-500" />
      case "failed":
        return <AlertCircle className="size-4 text-red-500" />
      default:
        return <Clock className="size-4 text-yellow-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "sent":
        return "Wysłana"
      case "failed":
        return "Błąd"
      default:
        return "Oczekujące"
    }
  }

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Ostatnie logi</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-muted-foreground text-sm">Ładowanie...</div>
        ) : logs.length === 0 ? (
          <div className="text-muted-foreground text-sm">Brak logów</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30 text-sm">
                <div className="mt-0.5">{getStatusIcon(log.status)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground line-clamp-1">{log.message_text}</p>
                  <p className="text-xs text-muted-foreground">Grupa: {log.group_id}</p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {getStatusLabel(log.status)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
