import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BotList } from "@/components/bots/bot-list"
import { BackendStatus } from "@/components/bots/backend-status"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-svh bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-chart-2/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="container mx-auto py-6 px-4 space-y-6">
          <BackendStatus />
          <BotList userId={data.user.id} />
        </div>
      </div>
    </div>
  )
}
