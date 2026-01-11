import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth/check-admin"

export async function DELETE(request: Request, { params }: { params: { botId: string } }) {
  try {
    await requireAdmin()

    const supabase = await createClient()

    const { error } = await supabase.from("bots").delete().eq("id", params.botId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
}
