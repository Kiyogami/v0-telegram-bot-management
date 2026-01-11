import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/check-admin"

export async function GET() {
  try {
    await requireAdmin()

    const supabase = await createClient()

    const { data: users, error } = await supabase
      .from("user_profiles")
      .select(`
        id,
        email,
        role,
        created_at
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Get bot count for each user
    const usersWithBotCount = await Promise.all(
      users.map(async (user) => {
        const { count } = await supabase.from("bots").select("*", { count: "exact", head: true }).eq("user_id", user.id)

        return {
          ...user,
          bot_count: count || 0,
        }
      }),
    )

    return NextResponse.json(usersWithBotCount)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
}
