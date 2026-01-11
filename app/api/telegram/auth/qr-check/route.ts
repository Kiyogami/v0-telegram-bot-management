import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { botId } = body

    const response = await fetch(`${PYTHON_BACKEND_URL}/api/telegram/auth/qr-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bot_id: botId }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.detail || "Błąd sprawdzania" }, { status: response.status })
    }

    // If authorized, save to database
    if (data.authorized && data.session_string) {
      try {
        const supabase = await createClient()
        await supabase
          .from("bots")
          .update({
            session_string: data.session_string,
            is_authorized: true,
          })
          .eq("id", botId)
        console.log("[v0] Session saved for bot:", botId)
      } catch (dbError) {
        console.error("[v0] DB save error:", dbError)
      }
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] QR check error:", error)
    return NextResponse.json({ error: error.message || "Błąd serwera" }, { status: 500 })
  }
}
