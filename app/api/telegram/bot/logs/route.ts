import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const botId = searchParams.get("botId")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    if (!botId) {
      return NextResponse.json({ error: "botId required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: logs, error } = await supabase
      .from("message_logs")
      .select("*")
      .eq("bot_id", botId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("[v0] Logs error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch logs" },
      { status: 500 },
    )
  }
}
