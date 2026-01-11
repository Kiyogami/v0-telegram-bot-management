"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Activity,
  MessageSquare,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  BarChart3,
  Send,
} from "lucide-react"

interface Bot {
  id: string
  name: string
  status: string
  message_content: string | null
  min_delay: number
  max_delay: number
  created_at: string
  is_authorized: boolean
}

interface BotLog {
  id: string
  log_type: string
  message: string
  created_at: string
}

interface MessageLog {
  id: string
  status: string
  message_text: string
  group_id: string
  sent_at: string
  error_message: string | null
}

interface GroupStats {
  group_name: string
  group_id: string
  messages_sent: number
  enabled: boolean
}

interface BotDetailsDialogProps {
  bot: Bot
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BotDetailsDialog({ bot, open, onOpenChange }: BotDetailsDialogProps) {
  const [logs, setLogs] = useState<BotLog[]>([])
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([])
  const [groupStats, setGroupStats] = useState<GroupStats[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({
    totalMessages: 0,
    successMessages: 0,
    failedMessages: 0,
    activeGroups: 0,
  })
  const supabase = createClient()

  const loadData = async () => {
    setIsLoading(true)

    const { data: logsData } = await supabase
      .from("bot_logs")
      .select("*")
      .eq("bot_id", bot.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (logsData) setLogs(logsData)

    const { data: messageData } = await supabase
      .from("message_logs")
      .select("*")
      .eq("bot_id", bot.id)
      .order("sent_at", { ascending: false })
      .limit(100)

    if (messageData) {
      setMessageLogs(messageData)
      const success = messageData.filter((m) => m.status === "sent").length
      const failed = messageData.filter((m) => m.status === "error").length
      setStats((prev) => ({
        ...prev,
        totalMessages: messageData.length,
        successMessages: success,
        failedMessages: failed,
      }))
    }

    const { data: groupsData } = await supabase.from("bot_groups").select("*").eq("bot_id", bot.id)

    if (groupsData) {
      setGroupStats(groupsData)
      setStats((prev) => ({
        ...prev,
        activeGroups: groupsData.filter((g) => g.enabled).length,
      }))
    }

    setIsLoading(false)
  }

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, bot.id])

  const successRate = stats.totalMessages > 0 ? Math.round((stats.successMessages / stats.totalMessages) * 100) : 0

  const getLogIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="size-4 text-green-500" />
      case "error":
        return <XCircle className="size-4 text-red-500" />
      case "info":
        return <Activity className="size-4 text-blue-500" />
      default:
        return <MessageSquare className="size-4 text-muted-foreground" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden glass border-border/50">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${bot.status === "running" ? "bg-primary/10 border border-primary/20" : "bg-muted/50 border border-border/50"}`}
              >
                <Activity className={`size-5 ${bot.status === "running" ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <DialogTitle className="text-xl">{bot.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">Szczegóły i statystyki bota</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="stats" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="size-4" />
              Statystyki
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <Send className="size-4" />
              Wiadomości
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="size-4" />
              Logi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MessageSquare className="size-4" />
                  <span className="text-xs">Wysłane</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.totalMessages}</p>
              </div>
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 text-green-500 mb-2">
                  <CheckCircle className="size-4" />
                  <span className="text-xs">Sukces</span>
                </div>
                <p className="text-2xl font-bold text-green-500">{stats.successMessages}</p>
              </div>
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 text-red-500 mb-2">
                  <XCircle className="size-4" />
                  <span className="text-xs">Błędy</span>
                </div>
                <p className="text-2xl font-bold text-red-500">{stats.failedMessages}</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 text-blue-500 mb-2">
                  <Users className="size-4" />
                  <span className="text-xs">Grupy</span>
                </div>
                <p className="text-2xl font-bold text-blue-500">{stats.activeGroups}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Współczynnik sukcesu</span>
                <span className="text-sm font-medium text-foreground">{successRate}%</span>
              </div>
              <Progress value={successRate} className="h-2" />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <TrendingUp className="size-4 text-muted-foreground" />
                Aktywność grup
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {groupStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Brak grup</p>
                ) : (
                  groupStats.map((group) => (
                    <div
                      key={group.group_id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${group.enabled ? "bg-green-500" : "bg-muted-foreground"}`}
                        />
                        <span className="text-sm text-foreground truncate max-w-[200px]">{group.group_name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{group.messages_sent} msg</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="mt-4">
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : messageLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="size-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Brak wysłanych wiadomości</p>
                </div>
              ) : (
                messageLogs.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg border ${msg.status === "sent" ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {msg.status === "sent" ? (
                          <CheckCircle className="size-4 text-green-500" />
                        ) : (
                          <XCircle className="size-4 text-red-500" />
                        )}
                        <span className="text-xs font-mono text-muted-foreground">{msg.group_id}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.sent_at).toLocaleString("pl-PL")}
                      </span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{msg.message_text}</p>
                    {msg.error_message && <p className="text-xs text-red-500 mt-1">{msg.error_message}</p>}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="size-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Brak logów</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/30"
                  >
                    {getLogIcon(log.log_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{log.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.created_at).toLocaleString("pl-PL")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
