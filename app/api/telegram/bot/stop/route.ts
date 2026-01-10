import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"

export async function POST(request: Request) {
  try {
    const { botId } = await request.json()

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

    // Verify bot ownership
    const { data: bot, error: botError } = await supabase
      .from("bots")
      .select("*")
      .eq("id", botId)
      .eq("user_id", user.id)
      .single()

    if (botError || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    }

    console.log(`[v0] Stopping bot ${bot.name} via Python backend`)

    const response = await fetch(`${PYTHON_BACKEND_URL}/api/telegram/bot/stop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bot_id: botId,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || "Failed to stop bot")
    }

    // Update bot status
    await supabase
      .from("bots")
      .update({
        status: "stopped",
      })
      .eq("id", botId)

    console.log(`[v0] Bot ${bot.name} stopped successfully`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Bot stop error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to stop bot" }, { status: 500 })
  }
}
