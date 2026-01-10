import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BotList } from "@/components/bots/bot-list"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <BotList userId={data.user.id} />
    </div>
  )
}
