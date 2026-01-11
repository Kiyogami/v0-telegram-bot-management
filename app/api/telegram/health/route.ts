import { NextResponse } from "next/server"

const PYTHON_BACKEND_URL = (process.env.PYTHON_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "")

export async function GET() {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`${PYTHON_BACKEND_URL}/health`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      return NextResponse.json({
        backend_status: "ok",
        backend_url: PYTHON_BACKEND_URL,
      })
    }

    return NextResponse.json(
      {
        backend_status: "error",
        backend_url: PYTHON_BACKEND_URL,
      },
      { status: 503 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        backend_status: "unreachable",
        backend_url: PYTHON_BACKEND_URL,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    )
  }
}
