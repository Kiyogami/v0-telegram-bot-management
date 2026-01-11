import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { checkIsAdmin } from "@/lib/auth/check-admin"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const isAdmin = await checkIsAdmin()
  if (!isAdmin) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-destructive/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="container mx-auto py-6 px-4">
          <AdminDashboard userId={data.user.id} />
        </div>
      </div>
    </div>
  )
}
