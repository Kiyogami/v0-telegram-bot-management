import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"

export async function POST(request: Request) {
  try {
    const { botId } = await request.json()
    console.log("[v0] Send code request for bot:", botId)

    if (!botId) {
      return NextResponse.json({ error: "Bot ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify user is authenticated
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

    console.log("[v0] Forwarding to Python backend for phone:", bot.phone_number)

    const response = await fetch(`${PYTHON_BACKEND_URL}/api/telegram/auth/send-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bot_id: botId,
        api_id: bot.api_id,
        api_hash: bot.api_hash,
        phone_number: bot.phone_number,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || "Failed to send code")
    }

    // Update bot status
    await supabase
      .from("bots")
      .update({
        last_auth_attempt: new Date().toISOString(),
        auth_error: null,
      })
      .eq("id", botId)

    console.log("[v0] Code sent successfully via Python backend")

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Telegram send code error:", error.message || error)

    return NextResponse.json({ error: error.message || "Failed to send code" }, { status: 500 })
  }
}
