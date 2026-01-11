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
            <span>Menadżer Botów Telegram</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Logowanie</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Rejestracja</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <h1 className="text-5xl font-bold tracking-tight text-balance">
              Zarządzaj wieloma botami Telegram z łatwością
            </h1>
            <p className="text-xl text-muted-foreground text-balance">
              Twórz, konfiguruj i uruchamiaj wiele botów Telegram 24/7 z jednego potężnego panelu. Wysyłaj
              zautomatyzowane wiadomości do grup z inteligentnymi opóźnieniami i śledzeniem.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button size="lg" asChild>
                <Link href="/auth/sign-up">Rozpocznij</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth/login">Panel</Link>
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
                <h3 className="text-xl font-semibold">Wiele botów</h3>
                <p className="text-muted-foreground">
                  Zarządzaj dziesiątkami botów z jednego panelu. Każdy bot może mieć własną konfigurację i szablony
                  wiadomości.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Zap className="size-6" />
                </div>
                <h3 className="text-xl font-semibold">Działanie 24/7</h3>
                <p className="text-muted-foreground">
                  Twoje boty działają nieprzerwanie w chmurze. Ustaw niestandardowe opóźnienia między wiadomościami, aby
                  uniknąć wykrycia spamu.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Shield className="size-6" />
                </div>
                <h3 className="text-xl font-semibold">Bezpieczne i prywatne</h3>
                <p className="text-muted-foreground">
                  Twoje dane logowania botów są szyfrowane i bezpiecznie przechowywane. Tylko Ty masz dostęp do swoich
                  botów i ich danych.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Menadżer Botów Telegram - Zbudowane na Next.js i Supabase</p>
        </div>
      </footer>
    </div>
  )
}
