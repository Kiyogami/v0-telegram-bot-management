import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BotIcon, Users, Zap, Shield } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <BotIcon className="size-6" />
            <span>Telegram Bot Manager</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <h1 className="text-5xl font-bold tracking-tight text-balance">Manage Multiple Telegram Bots with Ease</h1>
            <p className="text-xl text-muted-foreground text-balance">
              Create, configure, and run multiple Telegram bots 24/7 from one powerful dashboard. Send automated
              messages to groups with smart delays and tracking.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button size="lg" asChild>
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth/login">Dashboard</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Users className="size-6" />
                </div>
                <h3 className="text-xl font-semibold">Multiple Bots</h3>
                <p className="text-muted-foreground">
                  Manage dozens of bots from a single dashboard. Each bot can have its own configuration and message
                  templates.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Zap className="size-6" />
                </div>
                <h3 className="text-xl font-semibold">24/7 Operation</h3>
                <p className="text-muted-foreground">
                  Your bots run continuously in the cloud. Set custom delays between messages to avoid spam detection.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Shield className="size-6" />
                </div>
                <h3 className="text-xl font-semibold">Secure & Private</h3>
                <p className="text-muted-foreground">
                  Your bot credentials are encrypted and stored securely. Only you have access to your bots and their
                  data.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Telegram Bot Manager - Built with Next.js and Supabase</p>
        </div>
      </footer>
    </div>
  )
}
