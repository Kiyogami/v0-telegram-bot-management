import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const botId = searchParams.get("botId")

    if (!botId) {
      return NextResponse.json({ error: "botId required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: logs } = await supabase.from("message_logs").select("status, sent_at").eq("bot_id", botId)

    const { data: groups } = await supabase
      .from("bot_groups")
      .select("messages_sent, last_message_at")
      .eq("bot_id", botId)

    const totalSent = logs?.filter((l) => l.status === "sent").length || 0
    const totalFailed = logs?.filter((l) => l.status === "failed").length || 0
    const lastMessage = logs?.[0]?.sent_at

    return NextResponse.json({
      totalMessages: totalSent,
      failedMessages: totalFailed,
      groupCount: groups?.length || 0,
      lastMessageTime: lastMessage,
      successRate: totalSent + totalFailed > 0 ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(1) : "N/A",
    })
  } catch (error) {
    console.error("[v0] Stats error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch stats" },
      { status: 500 },
    )
  }
}
