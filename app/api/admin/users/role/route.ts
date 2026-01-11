import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/check-admin"

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const { userId, role } = await request.json()

    const supabase = await createClient()

    const { error } = await supabase.from("user_profiles").update({ role }).eq("id", userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
}
