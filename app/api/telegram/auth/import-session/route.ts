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
    const formData = await request.formData()
    const botId = formData.get("botId") as string
    const sessionFile = formData.get("sessionFile") as File

    if (!botId || !sessionFile) {
      return NextResponse.json({ error: "Bot ID and session file are required" }, { status: 400 })
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

    const backendFormData = new FormData()
    backendFormData.append("session_file", sessionFile)
    backendFormData.append("api_id", bot.api_id)
    backendFormData.append("api_hash", bot.api_hash)
    backendFormData.append("phone", bot.phone_number)

    const response = await fetch(`${PYTHON_BACKEND_URL}/import-session`, {
      method: "POST",
      body: backendFormData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || "Failed to import session")
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
    }

    return NextResponse.json({ success: true, message: data.info || "Sesja zaimportowana!" })
  } catch (error: any) {
    console.error("[v0] Import session error:", error.message)
    return NextResponse.json({ error: error.message || "Failed to import session" }, { status: 500 })
  }
}
