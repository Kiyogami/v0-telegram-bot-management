import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/check-admin"

export async function GET() {
  try {
    await requireAdmin()

    const supabase = await createClient()

    const { data: bots, error } = await supabase
      .from("bots")
      .select(`
        id,
        name,
        phone_number,
        status,
        messages_sent_today,
        created_at,
        user_id
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Get user emails
    const botsWithUserEmail = await Promise.all(
      bots.map(async (bot) => {
        const { data: profile } = await supabase.from("user_profiles").select("email").eq("id", bot.user_id).single()

        return {
          ...bot,
          user_email: profile?.email || "Unknown",
          messages_sent: bot.messages_sent_today || 0,
        }
      }),
    )

    return NextResponse.json(botsWithUserEmail)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
}
