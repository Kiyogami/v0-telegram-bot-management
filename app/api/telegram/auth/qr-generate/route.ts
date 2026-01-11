import { type NextRequest, NextResponse } from "next/server"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { botId, apiId, apiHash } = body

    console.log("[v0] QR generate request for bot:", botId)
    console.log("[v0] Backend URL:", PYTHON_BACKEND_URL)

    const response = await fetch(`${PYTHON_BACKEND_URL}/api/telegram/auth/qr-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bot_id: botId,
        api_id: apiId,
        api_hash: apiHash,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[v0] Backend error:", data)
      return NextResponse.json({ error: data.detail || "Nie udało się wygenerować QR" }, { status: response.status })
    }

    console.log("[v0] QR code generated")
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] QR generate error:", error)
    return NextResponse.json({ error: error.message || "Błąd serwera" }, { status: 500 })
  }
}
