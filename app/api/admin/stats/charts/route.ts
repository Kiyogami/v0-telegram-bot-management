import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/check-admin"

export async function GET() {
  try {
    await requireAdmin()

    const supabase = await createClient()

    // Generate last 7 days data
    const chartData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      // Count messages for this day
      const { count: messages } = await supabase
        .from("message_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", `${dateStr}T00:00:00`)
        .lt("created_at", `${dateStr}T23:59:59`)

      // Count new users for this day
      const { count: newUsers } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", `${dateStr}T00:00:00`)
        .lt("created_at", `${dateStr}T23:59:59`)

      chartData.push({
        date: date.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" }),
        messages: messages || 0,
        newUsers: newUsers || 0,
      })
    }

    return NextResponse.json(chartData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
}
