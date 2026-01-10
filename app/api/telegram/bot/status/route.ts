import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const botId = searchParams.get("botId")

    if (!botId) {
      return NextResponse.json({ error: "Bot ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get bot details
    const { data: bot, error: botError } = await supabase
      .from("bots")
      .select("*")
      .eq("id", botId)
      .eq("user_id", user.id)
      .single()

    if (botError || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    }

    // Get recent logs
    const { data: logs } = await supabase
      .from("bot_logs")
      .select("*")
      .eq("bot_id", botId)
      .order("created_at", { ascending: false })
      .limit(10)

    // Get groups count
    const { count: groupsCount } = await supabase
      .from("bot_groups")
      .select("*", { count: "exact", head: true })
      .eq("bot_id", botId)

    return NextResponse.json({
      bot,
      logs: logs || [],
      groupsCount: groupsCount || 0,
    })
  } catch (error) {
    console.error("[v0] Bot status error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get bot status" },
      { status: 500 },
    )
  }
}
