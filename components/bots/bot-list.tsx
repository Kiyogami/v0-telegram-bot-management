"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BotIcon, Plus, LogOut, Play, Square, Trash2, Edit, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { BotDialog } from "./bot-dialog"
import { Badge } from "@/components/ui/badge"
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
  const [togglingBotId, setTogglingBotId] = useState<string | null>(null) // added loading state for toggle
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
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const handleToggleBotStatus = async (bot: Bot) => {
    if (!bot.is_authorized && bot.status !== "running") {
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
        throw new Error(data.error || "Failed to toggle bot status")
      }

      await loadBots()
    } catch (error) {
      console.error("[v0] Toggle bot error:", error)
      alert(error instanceof Error ? error.message : "Failed to toggle bot status")
    } finally {
      setTogglingBotId(null)
    }
  }

  const handleDeleteBot = async () => {
    if (!deletingBotId) return

    const { error } = await supabase.from("bots").delete().eq("id", deletingBotId)

    if (!error) {
      setDeletingBotId(null)
      loadBots()
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
    loadBots()
  }

  const handleAuthComplete = () => {
    setAuthorizingBot(null)
    loadBots()
  }

  return (
    <>
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <BotIcon className="size-6" />
            <span>Bot Manager</span>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your Telegram Bots</h1>
            <p className="text-muted-foreground mt-1">Manage and monitor your bots in one place</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="size-4" />
            Add New Bot
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading bots...</p>
          </div>
        ) : bots.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BotIcon className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No bots yet</h3>
              <p className="text-muted-foreground mb-4">Create your first bot to get started</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="size-4" />
                Add Your First Bot
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bots.map((bot) => (
              <Card key={bot.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <BotIcon className="size-5" />
                        {bot.name}
                      </CardTitle>
                      <CardDescription className="mt-2">{bot.phone_number}</CardDescription>
                    </div>
                    <Badge
                      variant={
                        bot.status === "running" ? "default" : bot.status === "error" ? "destructive" : "secondary"
                      }
                    >
                      {bot.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {!bot.is_authorized && (
                      <div className="text-sm bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 rounded p-2">
                        Not authorized - Click Start to authorize
                      </div>
                    )}
                    {bot.auth_error && (
                      <div className="text-sm bg-destructive/10 text-destructive rounded p-2">{bot.auth_error}</div>
                    )}
                    <div className="text-sm">
                      <span className="text-muted-foreground">Delay: </span>
                      <span className="font-medium">
                        {bot.min_delay}-{bot.max_delay}s
                      </span>
                    </div>
                    {bot.message_content && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Message: </span>
                        <p className="text-xs bg-muted rounded p-2 mt-1 line-clamp-2">{bot.message_content}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant={bot.status === "running" ? "destructive" : "default"}
                        onClick={() => handleToggleBotStatus(bot)}
                        disabled={togglingBotId === bot.id}
                        className="flex-1"
                      >
                        {togglingBotId === bot.id ? (
                          "Loading..."
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
                        onClick={() => setManagingGroupsBot(bot)}
                        title="Manage Groups"
                      >
                        <Users className="size-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(bot)}>
                        <Edit className="size-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setDeletingBotId(bot.id)}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
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

      <AlertDialog open={!!deletingBotId} onOpenChange={() => setDeletingBotId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bot? This action cannot be undone and all associated data will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBot}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
