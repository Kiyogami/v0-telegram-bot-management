import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { botId } = await request.json()

    // Get bot details from database
    const { data: bot, error: botError } = await supabase
      .from("bots")
      .select("*")
      .eq("id", botId)
      .eq("user_id", user.id)
      .single()

    if (botError || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    }

    if (!bot.session_string) {
      return NextResponse.json({ error: "Bot not authenticated" }, { status: 400 })
    }

    // Call Python backend to fetch groups
    const backendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"
    const url = `${backendUrl.replace(/\/$/, "")}/api/telegram/groups/fetch`

    console.log("[v0] Fetching groups from Python backend:", url)

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bot_id: botId,
        api_id: bot.api_id,
        api_hash: bot.api_hash,
        session_string: bot.session_string,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Python backend error:", errorText)
      throw new Error(`Backend returned ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log("[v0] Found groups:", data.groups?.length || 0)

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching groups:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch groups" },
      { status: 500 },
    )
  }
}
