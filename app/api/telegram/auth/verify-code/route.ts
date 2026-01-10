import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"

export async function POST(request: Request) {
  try {
    const { botId, code } = await request.json()
    console.log("[v0] Verify code request for bot:", botId)

    if (!botId || !code) {
      return NextResponse.json({ error: "Bot ID and code are required" }, { status: 400 })
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

    console.log("[v0] Forwarding code verification to Python backend")

    const response = await fetch(`${PYTHON_BACKEND_URL}/api/telegram/auth/verify-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bot_id: botId,
        phone_code: code,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || "Failed to verify code")
    }

    // Check if 2FA is required
    if (data.requires_password) {
      console.log("[v0] 2FA required")
      return NextResponse.json({ needsPassword: true }, { status: 200 })
    }

    // Save session string to database
    if (data.session_string) {
      await supabase
        .from("bots")
        .update({
          is_authorized: true,
          session_string: data.session_string,
          auth_error: null,
        })
        .eq("id", botId)

      console.log("[v0] Session saved to database")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Telegram verify code error:", error)

    const { botId } = await request.json()
    if (botId) {
      const supabase = await createClient()
      await supabase
        .from("bots")
        .update({
          auth_error: error instanceof Error ? error.message : "Verification failed",
        })
        .eq("id", botId)
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to verify code" },
      { status: 500 },
    )
  }
}
