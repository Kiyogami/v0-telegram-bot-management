import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function ensureProtocol(url: string): string {
  if (!url) return url
  // If URL doesn't start with http:// or https://, add https://
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`
  }
  return url.replace(/\/$/, "")
}

const PYTHON_BACKEND_URL = ensureProtocol(process.env.PYTHON_BACKEND_URL || "http://localhost:8000")

export async function POST(request: Request) {
  try {
    const { botId } = await request.json()
    console.log("[v0] Send code request for bot:", botId)

    if (!process.env.PYTHON_BACKEND_URL) {
      return NextResponse.json(
        {
          error: "Python backend nie jest skonfigurowany. Dodaj PYTHON_BACKEND_URL w zmiennych środowiskowych.",
          helpText:
            "Potrzebujesz uruchomić Python backend i dodać jego PUBLICZNY URL (np. https://twoj-backend.up.railway.app) do zmiennych środowiskowych.",
        },
        { status: 500 },
      )
    }

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
    console.log("[v0] Python backend URL:", PYTHON_BACKEND_URL)
    console.log("[v0] Full request URL:", `${PYTHON_BACKEND_URL}/api/telegram/auth/send-code`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
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
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Python backend error response:", response.status, errorText)

        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { detail: errorText }
        }

        throw new Error(
          errorData.detail ||
            `Python backend zwrócił błąd ${response.status}. ` +
              `Sprawdź czy Railway wdrożył najnowszą wersję kodu z endpointem /api/telegram/auth/send-code`,
        )
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("[v0] Python backend returned non-JSON response:", contentType)
        throw new Error(
          `Python backend nie odpowiada poprawnie na: ${PYTHON_BACKEND_URL}\n\n` +
            `Sprawdź:\n` +
            `1. Czy używasz PUBLICZNEGO URL Railway (np. https://twoj-backend.up.railway.app)\n` +
            `2. Czy Python backend jest uruchomiony\n` +
            `3. Czy URL ma protokół https://\n` +
            `4. Czy Railway wdrożył najnowszą wersję kodu`,
        )
      }

      const data = await response.json()

      await supabase
        .from("bots")
        .update({
          phone_code_hash: data.phone_code_hash,
          last_auth_attempt: new Date().toISOString(),
          auth_error: null,
        })
        .eq("id", botId)

      console.log("[v0] Code sent successfully and phone_code_hash saved to database")
      console.log("[v0] Code type:", data.code_type)
      console.log("[v0] Message:", data.message)

      // Return full information from Python backend
      return NextResponse.json({
        success: true,
        code_type: data.code_type,
        message: data.message,
      })
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      if (fetchError.name === "AbortError") {
        throw new Error(
          `Python backend timeout.\n\nURL: ${PYTHON_BACKEND_URL}\n\nUpewnij się że:\n1. Backend jest uruchomiony\n2. Używasz PUBLICZNEGO URL (nie .railway.internal)\n3. Railway wdrożył najnowszą wersję`,
        )
      }

      throw fetchError
    }
  } catch (error: any) {
    console.error("[v0] Telegram send code error:", error.message || error)

    return NextResponse.json(
      {
        error: error.message || "Failed to send code",
        helpText:
          "Backend URL: " +
          PYTHON_BACKEND_URL +
          "\n\nUpewnij się, że:\n1. Używasz PUBLICZNEGO URL Railway (nie .railway.internal)\n2. Railway wdrożył najnowszą wersję python-backend/main.py\n3. Endpoint /api/telegram/auth/send-code istnieje w kodzie",
      },
      { status: 500 },
    )
  }
}
