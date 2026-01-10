import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { TelegramClient } from "telegram"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"

// Store active bot instances
const activeBots = new Map<string, { client: TelegramClient; intervalId: NodeJS.Timeout }>()

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

    if (!bot.is_authorized || !bot.session_string) {
      return NextResponse.json({ error: "Bot is not authorized" }, { status: 400 })
    }

    // Get all groups for this bot
    const { data: groups } = await supabase.from("bot_groups").select("group_id").eq("bot_id", botId)

    const groupIds = groups?.map((g) => Number.parseInt(g.group_id)) || []

    console.log(`[v0] Starting bot ${bot.name} with ${groupIds.length} groups via Python backend`)

    const response = await fetch(`${PYTHON_BACKEND_URL}/api/telegram/bot/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bot_id: botId,
        api_id: bot.api_id,
        api_hash: bot.api_hash,
        phone_number: bot.phone_number,
        session_string: bot.session_string,
        message_template: bot.message_content || "Hello from Bot!",
        min_delay: bot.min_delay || 20,
        max_delay: bot.max_delay || 40,
        group_ids: groupIds,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || "Failed to start bot")
    }

    // Update bot status
    await supabase
      .from("bots")
      .update({
        status: "running",
        auth_error: null,
      })
      .eq("id", botId)

    console.log(`[v0] Bot ${bot.name} started successfully via Python backend`)

    return NextResponse.json({ success: true, groups: groupIds.length })
  } catch (error) {
    console.error("[v0] Bot start error:", error)

    const { botId } = await request.json()
    if (botId) {
      const supabase = await createClient()
      await supabase
        .from("bots")
        .update({
          status: "error",
          auth_error: error instanceof Error ? error.message : "Failed to start bot",
        })
        .eq("id", botId)
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to start bot" }, { status: 500 })
  }
}
