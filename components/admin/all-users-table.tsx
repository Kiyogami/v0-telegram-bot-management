"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, ShieldOff } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  email: string
  role: string
  created_at: string
  bot_count: number
}

export function AllUsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Nie udało się pobrać użytkowników")
    } finally {
      setLoading(false)
    }
  }

  async function toggleAdmin(userId: string, currentRole: string) {
    const newRole = currentRole === "admin" ? "user" : "admin"

    try {
      const response = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      })

      if (response.ok) {
        toast.success(`Zmieniono rolę na ${newRole}`)
        fetchUsers()
      } else {
        toast.error("Nie udało się zmienić roli")
      }
    } catch (error) {
      toast.error("Błąd podczas zmiany roli")
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
      <h3 className="text-xl font-bold mb-4">Wszyscy Użytkownicy</h3>

      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <p className="font-medium">{user.email}</p>
              <p className="text-sm text-muted-foreground">
                {user.bot_count} botów • Dołączył {new Date(user.created_at).toLocaleDateString("pl-PL")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
                {user.role === "admin" ? "Admin" : "User"}
              </Badge>

              <Button size="sm" variant="outline" onClick={() => toggleAdmin(user.id, user.role)}>
                {user.role === "admin" ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
