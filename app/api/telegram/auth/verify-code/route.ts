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
    const { botId, code } = await request.json()

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

    const { data: bot, error: botError } = await supabase
      .from("bots")
      .select("*")
      .eq("id", botId)
      .eq("user_id", user.id)
      .single()

    if (botError || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    }

    // Forwarding code verification to Python backend with stored phone_code_hash
    const response = await fetch(`${PYTHON_BACKEND_URL}/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: bot.phone_number,
        code: code,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || "Failed to verify code")
    }

    // Check if 2FA is required
    if (data.status === "PASSWORD_REQUIRED") {
      return NextResponse.json({ needsPassword: true, message: data.info }, { status: 200 })
    }

    // Save session string to database
    if (data.session_string) {
      await supabase
        .from("bots")
        .update({
          is_authorized: true,
          session_string: data.session_string,
          phone_code_hash: null,
          auth_error: null,
        })
        .eq("id", botId)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Verify code error:", error.message)
    return NextResponse.json({ error: error.message || "Failed to verify code" }, { status: 500 })
  }
}
