"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, CheckCircle, AlertCircle, Info, Trash2 } from "lucide-react"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  const loadNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.read).length)
    }
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id)
    loadNotifications()
  }

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id)
    loadNotifications()
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="size-4 text-green-500" />
      case "error":
        return <AlertCircle className="size-4 text-red-500" />
      default:
        return <Info className="size-4 text-blue-500" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 size-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 glass border-border/50">
        <div className="p-3 border-b border-border/50">
          <h4 className="font-semibold text-foreground">Powiadomienia</h4>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="size-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Brak powiadomień</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 border-b border-border/30 last:border-0 ${!notif.read ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-start gap-3">
                  {getIcon(notif.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{notif.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notif.created_at).toLocaleString("pl-PL")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {!notif.read && (
                      <Button variant="ghost" size="icon" className="size-6" onClick={() => markAsRead(notif.id)}>
                        <CheckCircle className="size-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteNotification(notif.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
