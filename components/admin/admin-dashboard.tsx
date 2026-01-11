"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Bot, Activity, TrendingUp } from "lucide-react"
import { AllUsersTable } from "./all-users-table"
import { AllBotsTable } from "./all-bots-table"
import { SystemStats } from "./system-stats"

interface AdminDashboardProps {
  userId: string
}

export function AdminDashboard({ userId }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBots: 0,
    activeBots: 0,
    totalMessages: 0,
  })
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "bots">("overview")

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel Administratora</h1>
          <p className="text-muted-foreground">Zarządzaj użytkownikami i botami</p>
        </div>
        <Badge variant="destructive" className="text-sm">
          ADMIN
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6 glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Użytkownicy</p>
              <p className="text-3xl font-bold">{stats.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Wszystkie Boty</p>
              <p className="text-3xl font-bold">{stats.totalBots}</p>
            </div>
            <Bot className="h-8 w-8 text-chart-2" />
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Aktywne Boty</p>
              <p className="text-3xl font-bold">{stats.activeBots}</p>
            </div>
            <Activity className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Wiadomości</p>
              <p className="text-3xl font-bold">{stats.totalMessages}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button variant={activeTab === "overview" ? "default" : "outline"} onClick={() => setActiveTab("overview")}>
          Przegląd
        </Button>
        <Button variant={activeTab === "users" ? "default" : "outline"} onClick={() => setActiveTab("users")}>
          Użytkownicy
        </Button>
        <Button variant={activeTab === "bots" ? "default" : "outline"} onClick={() => setActiveTab("bots")}>
          Wszystkie Boty
        </Button>
      </div>

      {/* Content */}
      {activeTab === "overview" && <SystemStats />}
      {activeTab === "users" && <AllUsersTable />}
      {activeTab === "bots" && <AllBotsTable />}
    </div>
  )
}
