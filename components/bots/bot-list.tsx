"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  BotIcon,
  Plus,
  LogOut,
  Play,
  Square,
  Trash2,
  Edit,
  Users,
  MessageSquare,
  Zap,
  BarChart3,
  Copy,
  Check,
  TestTube2,
  Download,
  PieChart,
  Trash,
  PlayCircle,
  StopCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { BotDialog } from "./bot-dialog"
import { BotDetailsDialog } from "./bot-details-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AuthDialog } from "./auth-dialog"
import { GroupsDialog } from "./groups-dialog"
import { TestModeDialog } from "./test-mode-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { ExportImportDialog } from "./export-import-dialog"
import { AnalyticsDialog } from "./analytics-dialog"
import { toast } from "sonner"

interface Bot {
  id: string
  name: string
  phone_number: string
  status: "running" | "stopped" | "error"
  message_content: string | null
  min_delay: number
  max_delay: number
  created_at: string
  is_authorized: boolean
  auth_error: string | null
  auto_reply_enabled?: boolean
  api_id: string
  api_hash: string
}

interface BotListProps {
  userId: string
}

export function BotList({ userId }: BotListProps) {
  const [bots, setBots] = useState<Bot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBot, setEditingBot] = useState<Bot | null>(null)
  const [deletingBotId, setDeletingBotId] = useState<string | null>(null)
  const [authorizingBot, setAuthorizingBot] = useState<Bot | null>(null)
  const [managingGroupsBot, setManagingGroupsBot] = useState<Bot | null>(null)
  const [detailsBot, setDetailsBot] = useState<Bot | null>(null)
  const [togglingBotId, setTogglingBotId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [testingBot, setTestingBot] = useState<Bot | null>(null)
  const [selectedBotIds, setSelectedBotIds] = useState<Set<string>>(new Set())
  const [isExportImportOpen, setIsExportImportOpen] = useState(false)
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)
  const [isBulkOperating, setIsBulkOperating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const loadBots = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.from("bots").select("*").order("created_at", { ascending: false })

    if (!error && data) {
      setBots(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadBots()
    const interval = setInterval(loadBots, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    toast.success("Wylogowano pomyślnie")
  }

  const handleToggleBotStatus = async (bot: Bot) => {
    if (!bot.is_authorized && bot.status !== "running") {
      toast.warning("Bot wymaga autoryzacji", {
        description: "Najpierw musisz autoryzować bota w Telegram",
      })
      setAuthorizingBot(bot)
      return
    }

    setTogglingBotId(bot.id)

    try {
      const endpoint = bot.status === "running" ? "/api/telegram/bot/stop" : "/api/telegram/bot/start"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: bot.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400 && data.error?.includes("Session expired")) {
          toast.error("Sesja Telegram wygasła!", {
            description: "Kliknij przycisk 'Autoryzuj' aby ponownie zalogować się do Telegram",
            duration: 5000,
          })
          setAuthorizingBot(bot)
          await supabase
            .from("bots")
            .update({
              is_authorized: false,
              status: "stopped",
              auth_error: "Sesja wygasła - wymagana ponowna autoryzacja",
            })
            .eq("id", bot.id)
          await loadBots()
          return
        }
        throw new Error(data.error || "Nie udało się zmienić statusu bota")
      }

      toast.success(bot.status === "running" ? "Bot zatrzymany" : "Bot uruchomiony")
      await loadBots()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się zmienić statusu bota")
    } finally {
      setTogglingBotId(null)
    }
  }

  const handleDeleteBot = async () => {
    if (!deletingBotId) return

    const { error } = await supabase.from("bots").delete().eq("id", deletingBotId)

    if (!error) {
      setDeletingBotId(null)
      toast.success("Bot usunięty")
      loadBots()
    } else {
      toast.error("Nie udało się usunąć bota")
    }
  }

  const handleEdit = (bot: Bot) => {
    setEditingBot(bot)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingBot(null)
  }

  const handleBotSaved = () => {
    handleCloseDialog()
    toast.success(editingBot ? "Bot zaktualizowany" : "Bot utworzony")
    loadBots()
  }

  const handleAuthComplete = () => {
    setAuthorizingBot(null)
    toast.success("Autoryzacja pomyślna")
    loadBots()
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    toast.success("ID skopiowane")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "status-running"
      case "error":
        return "status-error"
      default:
        return "status-stopped"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "running":
        return "Aktywny"
      case "error":
        return "Błąd"
      default:
        return "Zatrzymany"
    }
  }

  const toggleSelectBot = (botId: string) => {
    const newSelected = new Set(selectedBotIds)
    if (newSelected.has(botId)) {
      newSelected.delete(botId)
    } else {
      newSelected.add(botId)
    }
    setSelectedBotIds(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedBotIds.size === bots.length) {
      setSelectedBotIds(new Set())
    } else {
      setSelectedBotIds(new Set(bots.map((b) => b.id)))
    }
  }

  const handleBulkStart = async () => {
    setIsBulkOperating(true)
    let successCount = 0
    for (const botId of selectedBotIds) {
      const bot = bots.find((b) => b.id === botId)
      if (bot && bot.status !== "running") {
        try {
          const response = await fetch("/api/telegram/bot/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ botId }),
          })
          if (response.ok) successCount++
        } catch (error) {
          console.error(`Failed to start bot ${botId}:`, error)
        }
      }
    }
    toast.success(`Uruchomiono ${successCount} bot(ów)`)
    setIsBulkOperating(false)
    setSelectedBotIds(new Set())
    loadBots()
  }

  const handleBulkStop = async () => {
    setIsBulkOperating(true)
    let successCount = 0
    for (const botId of selectedBotIds) {
      const bot = bots.find((b) => b.id === botId)
      if (bot && bot.status === "running") {
        try {
          const response = await fetch("/api/telegram/bot/stop", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ botId }),
          })
          if (response.ok) successCount++
        } catch (error) {
          console.error(`Failed to stop bot ${botId}:`, error)
        }
      }
    }
    toast.success(`Zatrzymano ${successCount} bot(ów)`)
    setIsBulkOperating(false)
    setSelectedBotIds(new Set())
    loadBots()
  }

  const handleBulkDelete = async () => {
    setIsBulkOperating(true)
    const { error } = await supabase.from("bots").delete().in("id", Array.from(selectedBotIds))
    if (!error) {
      toast.success(`Usunięto ${selectedBotIds.size} bot(ów)`)
      setSelectedBotIds(new Set())
      loadBots()
    } else {
      toast.error("Nie udało się usunąć botów")
    }
    setIsBulkOperating(false)
  }

  const selectedBots = bots.filter((bot) => selectedBotIds.has(bot.id))

  return (
    <>
      <header className="glass sticky top-0 z-50 border-b border-border/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <BotIcon className="size-5 text-primary" />
            </div>
            <div>
              <span className="font-semibold text-foreground">TeleBot Manager</span>
              <span className="hidden sm:inline text-muted-foreground text-sm ml-2">/ Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedBotIds.size > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkStart}
                  disabled={isBulkOperating}
                  title="Uruchom zaznaczone"
                >
                  <PlayCircle className="size-4" />
                  <span className="hidden sm:inline">Start ({selectedBotIds.size})</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkStop}
                  disabled={isBulkOperating}
                  title="Zatrzymaj zaznaczone"
                >
                  <StopCircle className="size-4" />
                  <span className="hidden sm:inline">Stop ({selectedBotIds.size})</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDelete}
                  disabled={isBulkOperating}
                  className="text-destructive hover:bg-destructive/10 bg-transparent"
                  title="Usuń zaznaczone"
                >
                  <Trash className="size-4" />
                  <span className="hidden sm:inline">Usuń ({selectedBotIds.size})</span>
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={() => setIsAnalyticsOpen(true)} title="Analityka">
              <PieChart className="size-4" />
              <span className="hidden sm:inline">Analityka</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsExportImportOpen(true)} title="Export/Import">
              <Download className="size-4" />
              <span className="hidden sm:inline">Export/Import</span>
            </Button>
            <ThemeToggle />
            <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Wyloguj</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 animate-fade-in">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Twoje Boty</h1>
              <p className="text-muted-foreground mt-1">Zarządzaj i monitoruj swoje boty Telegram</p>
            </div>
            <div className="flex gap-2">
              {bots.length > 0 && (
                <div
                  className="inline-flex items-center gap-2 cursor-pointer select-none rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={toggleSelectAll}
                  title={selectedBotIds.size === bots.length ? "Odznacz wszystkie" : "Zaznacz wszystkie"}
                >
                  <Checkbox checked={selectedBotIds.size === bots.length} />
                  <span>Wszystkie</span>
                </div>
              )}
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
              >
                <Plus className="size-4" />
                Nowy bot
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                  <BotIcon className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{bots.length}</p>
                  <p className="text-xs text-muted-foreground">Wszystkie boty</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-green-500/10">
                  <Zap className="size-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {bots.filter((b) => b.status === "running").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Aktywne</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-yellow-500/10">
                  <MessageSquare className="size-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {bots.filter((b) => b.auto_reply_enabled).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Auto-odpowiedzi</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-xl p-4 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10">
                  <BarChart3 className="size-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{bots.filter((b) => b.is_authorized).length}</p>
                  <p className="text-xs text-muted-foreground">Autoryzowane</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Ładowanie botów...</p>
            </div>
          </div>
        ) : bots.length === 0 ? (
          <div className="glass rounded-2xl border border-border/50 gradient-border">
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
                <BotIcon className="size-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Brak botów</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Utwórz swojego pierwszego bota Telegram aby rozpocząć automatyzację
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              >
                <Plus className="size-4" />
                Dodaj pierwszego bota
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bots.map((bot, index) => (
              <Card
                key={bot.id}
                className="glass border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 animate-slide-up group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={selectedBotIds.has(bot.id)} onCheckedChange={() => toggleSelectBot(bot.id)} />
                      <div
                        className={`p-2.5 rounded-xl transition-colors ${bot.status === "running" ? "bg-primary/10 border border-primary/20" : "bg-muted/50 border border-border/50"}`}
                      >
                        <BotIcon
                          className={`size-5 ${bot.status === "running" ? "text-primary" : "text-muted-foreground"}`}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {bot.name}
                        </h3>
                        <p className="text-sm text-muted-foreground font-mono">{bot.phone_number}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(bot.status)}`}>
                      {getStatusText(bot.status)}
                    </span>
                  </div>

                  {!bot.is_authorized && (
                    <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm flex items-center gap-2 animate-pulse-glow">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                      <span className="font-medium">Wymaga autoryzacji Telegram</span>
                    </div>
                  )}

                  {bot.auth_error && (
                    <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                      <span className="font-medium">{bot.auth_error}</span>
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Opóźnienie</span>
                      <span className="font-mono text-foreground">
                        {bot.min_delay}-{bot.max_delay}s
                      </span>
                    </div>
                    {bot.auto_reply_enabled && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Auto-odpowiedź</span>
                        <span className="text-primary">Włączona</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">ID</span>
                      <button
                        onClick={() => handleCopyId(bot.id)}
                        className="flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {bot.id.slice(0, 8)}...
                        {copiedId === bot.id ? (
                          <Check className="size-3 text-green-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {bot.message_content && (
                    <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">Wiadomość:</p>
                      <p className="text-sm text-foreground line-clamp-2">{bot.message_content}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={bot.status === "running" ? "destructive" : "default"}
                      onClick={() => handleToggleBotStatus(bot)}
                      disabled={togglingBotId === bot.id}
                      className={`flex-1 transition-all ${bot.status !== "running" ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20" : ""}`}
                    >
                      {togglingBotId === bot.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : bot.status === "running" ? (
                        <>
                          <Square className="size-3" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="size-3" />
                          Start
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTestingBot(bot)}
                      title="Tryb testowy"
                      className="border-border/50 hover:border-primary/50 hover:bg-primary/5"
                    >
                      <TestTube2 className="size-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDetailsBot(bot)}
                      title="Szczegóły i statystyki"
                      className="border-border/50 hover:border-primary/50 hover:bg-primary/5"
                    >
                      <BarChart3 className="size-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setManagingGroupsBot(bot)}
                      title="Zarządzaj grupami"
                      className="border-border/50 hover:border-primary/50 hover:bg-primary/5"
                    >
                      <Users className="size-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(bot)}
                      className="border-border/50 hover:border-primary/50 hover:bg-primary/5"
                    >
                      <Edit className="size-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeletingBotId(bot.id)}
                      className="border-border/50 hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BotDialog open={isDialogOpen} onOpenChange={handleCloseDialog} onBotSaved={handleBotSaved} bot={editingBot} />

      {authorizingBot && (
        <AuthDialog
          bot={authorizingBot}
          open={!!authorizingBot}
          onOpenChange={(open) => !open && setAuthorizingBot(null)}
          onAuthComplete={handleAuthComplete}
        />
      )}

      {managingGroupsBot && (
        <GroupsDialog
          botId={managingGroupsBot.id}
          botName={managingGroupsBot.name}
          open={!!managingGroupsBot}
          onOpenChange={(open) => !open && setManagingGroupsBot(null)}
        />
      )}

      {detailsBot && (
        <BotDetailsDialog bot={detailsBot} open={!!detailsBot} onOpenChange={(open) => !open && setDetailsBot(null)} />
      )}

      {testingBot && (
        <TestModeDialog
          botId={testingBot.id}
          botName={testingBot.name}
          open={!!testingBot}
          onOpenChange={(open) => !open && setTestingBot(null)}
        />
      )}

      <ExportImportDialog
        selectedBots={selectedBots}
        open={isExportImportOpen}
        onOpenChange={setIsExportImportOpen}
        onImported={loadBots}
      />

      <AnalyticsDialog bots={bots} open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen} />

      <AlertDialog open={!!deletingBotId} onOpenChange={() => setDeletingBotId(null)}>
        <AlertDialogContent className="glass border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń bota</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć tego bota? Ta akcja jest nieodwracalna i wszystkie powiązane dane zostaną
              trwale usunięte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50">Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBot} className="bg-destructive hover:bg-destructive/90">
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
