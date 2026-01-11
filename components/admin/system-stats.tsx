"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

export function SystemStats() {
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    fetchChartData()
  }, [])

  async function fetchChartData() {
    try {
      const response = await fetch("/api/admin/stats/charts")
      if (response.ok) {
        const data = await response.json()
        setChartData(data)
      }
    } catch (error) {
      console.error("Error fetching chart data:", error)
    }
  }

  return (
    <div className="grid gap-6">
      <Card className="p-6 glass-card">
        <h3 className="text-xl font-bold mb-4">Aktywność w ostatnich 7 dniach</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
            <YAxis stroke="hsl(var(--foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
              }}
            />
            <Line type="monotone" dataKey="messages" stroke="hsl(var(--primary))" strokeWidth={2} />
            <Line type="monotone" dataKey="newUsers" stroke="hsl(var(--chart-2))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
