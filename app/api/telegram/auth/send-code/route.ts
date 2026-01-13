import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function ensureProtocol(url: string): string {
  if (!url) return url
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`
  }
  return url.replace(/\/$/, "")
}

const PYTHON_BACKEND_URL = ensureProtocol(process.env.PYTHON_BACKEND_URL || "http://localhost:8000")

export async function POST(request: Request) {
  try {
    const { botId } = await request.json()

    if (!process.env.PYTHON_BACKEND_URL) {
      return NextResponse.json(
        { error: "Python backend nie jest skonfigurowany. Dodaj PYTHON_BACKEND_URL." },
        { status: 500 },
      )
    }

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

    const { data: bot, error: botError } = await supabase
      .from("bots")
      .select("*")
      .eq("id", botId)
      .eq("user_id", user.id)
      .single()

    if (botError || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    }

    const response = await fetch(`${PYTHON_BACKEND_URL}/send-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_id: Number.parseInt(bot.api_id),
        api_hash: bot.api_hash,
        phone: bot.phone_number,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Unknown error" }))
      throw new Error(errorData.detail || `Backend error: ${response.status}`)
    }

    const data = await response.json()

    await supabase
      .from("bots")
      .update({ last_auth_attempt: new Date().toISOString(), auth_error: null })
      .eq("id", botId)

    return NextResponse.json({
      success: true,
      message: data.info || "Kod wysłany! Sprawdź aplikację Telegram.",
    })
  } catch (error: any) {
    console.error("[v0] Send code error:", error.message)
    return NextResponse.json({ error: error.message || "Failed to send code" }, { status: 500 })
  }
}
