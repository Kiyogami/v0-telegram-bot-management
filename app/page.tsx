import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BotIcon, Users, Zap, Shield, MessageSquare, BarChart3, Clock, ArrowRight, Sparkles } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-background overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-chart-2/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <header className="relative z-10 glass border-b border-border/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <BotIcon className="size-5 text-primary" />
            </div>
            <span className="font-semibold text-lg text-foreground">TeleBot Manager</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/auth/login">Zaloguj się</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Link href="/auth/sign-up">Zarejestruj się</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
              <Sparkles className="size-4" />
              Automatyzacja Telegram 24/7
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground text-balance leading-tight">
              Zarządzaj wieloma botami
              <span className="text-primary"> Telegram</span>
              <br />z jednego miejsca
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
              Twórz, konfiguruj i uruchamiaj boty Telegram działające non-stop. Wysyłaj automatyczne wiadomości do grup
              z inteligentnymi opóźnieniami i pełnym śledzeniem.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                asChild
                className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 text-lg px-8 h-14"
              >
                <Link href="/auth/sign-up">
                  Rozpocznij za darmo
                  <ArrowRight className="size-5 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-border/50 hover:bg-muted/50 text-lg px-8 h-14 bg-transparent"
              >
                <Link href="/auth/login">Przejdź do panelu</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-12 max-w-lg mx-auto">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-foreground">24/7</p>
                <p className="text-sm text-muted-foreground mt-1">Działanie</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-foreground">∞</p>
                <p className="text-sm text-muted-foreground mt-1">Botów</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-foreground">100%</p>
                <p className="text-sm text-muted-foreground mt-1">Prywatność</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Wszystko czego potrzebujesz</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Pełen zestaw narzędzi do automatyzacji Telegram w jednym miejscu
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="glass rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 group">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Users className="size-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Wiele botów</h3>
                <p className="text-muted-foreground">
                  Zarządzaj dziesiątkami botów z jednego panelu. Każdy bot ma własną konfigurację i szablony wiadomości.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 group">
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="size-6 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Działanie 24/7</h3>
                <p className="text-muted-foreground">
                  Twoje boty działają nieprzerwanie w chmurze. Ustaw własne opóźnienia między wiadomościami.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 group">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="size-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Auto-odpowiedzi</h3>
                <p className="text-muted-foreground">
                  Automatycznie odpowiadaj na wiadomości prywatne własnym tekstem. Nigdy nie przegap klienta.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="glass rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 group">
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Clock className="size-6 text-yellow-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Harmonogram</h3>
                <p className="text-muted-foreground">
                  Ustaw godziny i dni aktywności bota. Kontroluj dzienny limit wiadomości aby uniknąć banów.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="glass rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 group">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="size-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Statystyki</h3>
                <p className="text-muted-foreground">
                  Śledź wysłane wiadomości, błędy i skuteczność każdego bota w czasie rzeczywistym.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="glass rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 group">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="size-6 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Bezpieczeństwo</h3>
                <p className="text-muted-foreground">
                  Twoje dane uwierzytelniające są szyfrowane i bezpiecznie przechowywane. Tylko Ty masz do nich dostęp.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="glass rounded-3xl border border-border/50 p-8 md:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-chart-2/5 pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Gotowy aby rozpocząć?</h2>
                <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                  Utwórz konto i uruchom swojego pierwszego bota w kilka minut. Całkowicie za darmo.
                </p>
                <Button
                  size="lg"
                  asChild
                  className="bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 text-lg px-8 h-14"
                >
                  <Link href="/auth/sign-up">
                    Zarejestruj się teraz
                    <ArrowRight className="size-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/50 py-8 glass">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>TeleBot Manager - Zbudowane z Next.js i Supabase</p>
        </div>
      </footer>
    </div>
  )
}
