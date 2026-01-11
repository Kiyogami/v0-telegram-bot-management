import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { botId, sessionString } = await request.json()

    if (!botId || !sessionString) {
      return NextResponse.json({ error: "Missing botId or sessionString" }, { status: 400 })
    }

    console.log("[v0] Verifying string session for bot:", botId)

    // Get bot details
    const { data: bot, error: botError } = await supabase
      .from("bots")
      .select("api_id, api_hash, phone_number")
      .eq("id", botId)
      .eq("user_id", user.id)
      .single()

    if (botError || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    }

    const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL?.replace(/\/$/, "")

    if (!PYTHON_BACKEND_URL) {
      return NextResponse.json({ error: "Backend URL not configured" }, { status: 500 })
    }

    console.log("[v0] Testing session with Python backend")

    // Test session with backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/telegram/groups/fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bot_id: botId,
        api_id: bot.api_id,
        api_hash: bot.api_hash,
        session_string: sessionString,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.log("[v0] Session validation failed:", errorData)
      return NextResponse.json({ error: "Nieprawidłowa sesja lub sesja wygasła" }, { status: 400 })
    }

    console.log("[v0] Session valid! Saving to database")

    // Save session to database
    const { error: updateError } = await supabase
      .from("bots")
      .update({
        session_string: sessionString,
        is_authorized: true,
        authorized_at: new Date().toISOString(),
      })
      .eq("id", botId)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("[v0] Failed to save session:", updateError)
      return NextResponse.json({ error: "Failed to save session" }, { status: 500 })
    }

    console.log("[v0] String session saved successfully")

    return NextResponse.json({
      success: true,
      message: "String session authorized successfully",
    })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "An error occurred" }, { status: 500 })
  }
}
