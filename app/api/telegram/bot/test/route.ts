import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { botId, groupId, message } = await request.json()

    if (!botId || !groupId || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Pobierz dane bota
    const { data: bot, error: botError } = await supabase.from("bots").select("*").eq("id", botId).single()

    if (botError || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    }

    if (!bot.session_string) {
      return NextResponse.json({ error: "Bot nie jest autoryzowany" }, { status: 400 })
    }

    // Wyślij testową wiadomość przez Python backend
    const backendUrl = process.env.PYTHON_BACKEND_URL
    if (!backendUrl) {
      return NextResponse.json({ error: "Python backend not configured" }, { status: 500 })
    }

    console.log("[v0] Sending test message via Python backend:", backendUrl)

    const response = await fetch(`${backendUrl}/api/telegram/test/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_id: bot.api_id,
        api_hash: bot.api_hash,
        phone_number: bot.phone_number,
        session_string: bot.session_string,
        group_id: groupId,
        message: message,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to send test message")
    }

    const result = await response.json()

    // Zapisz log testowej wiadomości
    await supabase.from("message_logs").insert({
      bot_id: botId,
      group_id: groupId,
      message_text: message,
      status: "sent",
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("[v0] Test message error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send test message" },
      { status: 500 },
    )
  }
}
