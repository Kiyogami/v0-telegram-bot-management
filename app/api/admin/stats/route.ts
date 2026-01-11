import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/check-admin"

export async function GET() {
  try {
    await requireAdmin()

    const supabase = await createClient()

    // Get total users
    const { count: totalUsers } = await supabase.from("user_profiles").select("*", { count: "exact", head: true })

    // Get total bots
    const { count: totalBots } = await supabase.from("bots").select("*", { count: "exact", head: true })

    // Get active bots
    const { count: activeBots } = await supabase
      .from("bots")
      .select("*", { count: "exact", head: true })
      .eq("status", "running")

    // Get total messages
    const { data: messageData } = await supabase.from("bots").select("messages_sent_today")

    const totalMessages = messageData?.reduce((sum, bot) => sum + (bot.messages_sent_today || 0), 0) || 0

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalBots: totalBots || 0,
      activeBots: activeBots || 0,
      totalMessages,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
}
