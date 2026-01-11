"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Bot {
  id: string
  name: string
  phone_number: string
  status: string
  user_email: string
  messages_sent: number
  created_at: string
}

export function AllBotsTable() {
  const [bots, setBots] = useState<Bot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBots()
  }, [])

  async function fetchBots() {
    try {
      const response = await fetch("/api/admin/bots")
      if (response.ok) {
        const data = await response.json()
        setBots(data)
      }
    } catch (error) {
      console.error("Error fetching bots:", error)
      toast.error("Nie udało się pobrać botów")
    } finally {
      setLoading(false)
    }
  }

  async function deleteBot(botId: string) {
    if (!confirm("Czy na pewno chcesz usunąć tego bota?")) return

    try {
      const response = await fetch(`/api/admin/bots/${botId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Bot usunięty")
        fetchBots()
      } else {
        toast.error("Nie udało się usunąć bota")
      }
    } catch (error) {
      toast.error("Błąd podczas usuwania bota")
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <p>Ładowanie...</p>
      </Card>
    )
  }

  return (
    <Card className="p-6 glass-card">
      <h3 className="text-xl font-bold mb-4">Wszystkie Boty w Systemie</h3>

      <div className="space-y-2">
        {bots.map((bot) => (
          <div key={bot.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <p className="font-medium">{bot.name}</p>
              <p className="text-sm text-muted-foreground">
                {bot.phone_number} • {bot.user_email} • {bot.messages_sent} wiadomości
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant={bot.status === "running" ? "default" : "secondary"}>
                {bot.status === "running" ? "Aktywny" : "Zatrzymany"}
              </Badge>

              <Button size="sm" variant="destructive" onClick={() => deleteBot(bot.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
