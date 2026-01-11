import { createClient } from "@/lib/supabase/server"

export async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: adminUser } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).single()

  return !!adminUser
}

export async function requireAdmin() {
  const isAdmin = await checkIsAdmin()

  if (!isAdmin) {
    throw new Error("Dostęp tylko dla administratorów")
  }

  return true
}
