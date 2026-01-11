"use client"

import { DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, Shield, Key, Send, AlertCircle, Smartphone, MessageSquare } from "lucide-react"

interface Bot {
  id: string
  name: string
  phone_number: string
  api_id: string
  api_hash: string
}

interface AuthDialogProps {
  bot: Bot
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuthComplete: () => void
}

type AuthStep = "method" | "initial" | "code" | "password" | "string-session" | "success" | "error"

export function AuthDialog({ bot, open, onOpenChange, onAuthComplete }: AuthDialogProps) {
  const [step, setStep] = useState<AuthStep>("method")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [stringSession, setStringSession] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [helpText, setHelpText] = useState<string | null>(null)
  const [codeType, setCodeType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSendCode = async () => {
    setIsLoading(true)
    setError(null)
    setHelpText(null)

    try {
      console.log("[v0] Sending code for bot:", bot.id)

      const response = await fetch("/api/telegram/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: bot.id }),
      })

      const data = await response.json()

      console.log("[v0] Send code response:", data)

      if (!response.ok) {
        if (data.helpText) {
          setHelpText(data.helpText)
        }
        throw new Error(data.error || "Failed to send code")
      }

      if (data.message) {
        setHelpText(data.message)
      }
      if (data.code_type) {
        setCodeType(data.code_type)
        console.log("[v0] Code type:", data.code_type)
      }

      setStep("code")
    } catch (err) {
      console.error("[v0] Send code error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
      setStep("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setError("Wprowadź kod weryfikacyjny")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/telegram/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: bot.id, code }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.needsPassword) {
          setStep("password")
          return
        }
        throw new Error(data.error || "Failed to verify code")
      }

      setStep("success")
      setTimeout(() => {
        onAuthComplete()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setStep("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      setError("Wprowadź hasło 2FA")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/telegram/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: bot.id, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify password")
      }

      setStep("success")
      setTimeout(() => {
        onAuthComplete()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setStep("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStringSessionAuth = async () => {
    if (!stringSession.trim()) {
      setError("Wprowadź String Session")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/telegram/auth/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: bot.id, sessionString: stringSession }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Nieprawidłowa sesja")
      }

      setStep("success")
      setTimeout(() => {
        onAuthComplete()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieprawidłowa sesja")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setStep("initial")
    setCode("")
    setPassword("")
    setError(null)
    setHelpText(null)
    setCodeType(null)
  }

  const getCodeTypeIcon = () => {
    if (codeType === "SentCodeTypeApp") {
      return <MessageSquare className="size-4 text-primary" />
    } else if (codeType === "SentCodeTypeSms") {
      return <Smartphone className="size-4 text-primary" />
    }
    return <Send className="size-4 text-primary" />
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass border-border/50 max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <Shield className="size-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Autoryzacja</DialogTitle>
                <DialogDescription>{bot.name}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {step === "method" && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-sm font-medium text-foreground mb-2">Wybierz metodę autoryzacji:</p>
                <p className="text-xs text-muted-foreground">
                  String Session to profesjonalna metoda używana przez managery botów
                </p>
              </div>

              <Button
                onClick={() => setStep("string-session")}
                className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-foreground/10">
                    <Key className="size-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">String Session (Zalecane)</p>
                    <p className="text-xs opacity-80">Brak kodów SMS, działa 24/7</p>
                  </div>
                </div>
              </Button>

              <Button
                onClick={() => setStep("initial")}
                variant="outline"
                className="w-full h-16 border-border/50 hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <MessageSquare className="size-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Kod SMS/App</p>
                    <p className="text-xs opacity-80">Tradycyjna metoda z kodem weryfikacyjnym</p>
                  </div>
                </div>
              </Button>

              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <p className="text-xs text-muted-foreground font-medium mb-2">Co to jest String Session?</p>
                <p className="text-xs text-muted-foreground">
                  To gotowa sesja Telegram którą generujesz jednorazowo. Bot działa potem bez kodów SMS i nie wygasa.
                  Profesjonalne rozwiązanie używane w farmach kont.
                </p>
              </div>
            </div>
          )}

          {step === "string-session" && (
            <div className="space-y-6 py-4">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Key className="size-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">Wklej String Session</p>
                    <p className="text-xs text-muted-foreground">
                      Wygeneruj String Session lokalnie i wklej tutaj. Bot będzie działał bez kodów SMS.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="string-session" className="text-foreground">
                  String Session
                </Label>
                <Textarea
                  id="string-session"
                  placeholder="1AgAO..."
                  value={stringSession}
                  onChange={(e) => setStringSession(e.target.value)}
                  rows={4}
                  className="font-mono text-xs bg-background/50 border-border/50 focus:border-primary/50 resize-none"
                />
                <div className="p-3 rounded-lg bg-muted/20 border border-border/30 space-y-2">
                  <p className="text-xs font-medium text-foreground">Jak wygenerować String Session?</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>
                      Zainstaluj Telethon: <code className="bg-muted px-1 py-0.5 rounded">pip install telethon</code>
                    </li>
                    <li>
                      Uruchom skrypt:{" "}
                      <a
                        href="https://gist.github.com/username/generate-session"
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        generate_session.py
                      </a>
                    </li>
                    <li>Skopiuj wygenerowany string i wklej powyżej</li>
                  </ol>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("method")}
                  className="flex-1 border-border/50"
                >
                  Wstecz
                </Button>
                <Button
                  onClick={handleStringSessionAuth}
                  disabled={isLoading}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Weryfikacja...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="size-4" />
                      Autoryzuj
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === "initial" && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="size-4 text-warning mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-2">Ważne! Gdzie przyjdzie kod?</p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>
                        <strong>90% przypadków:</strong> Kod przychodzi do <strong>aplikacji Telegram</strong> (nie
                        SMS!)
                      </li>
                      <li>Sprawdź "Wiadomości od Telegram" w aplikacji na telefonie</li>
                      <li>Jeśli numer jest już zalogowany w Telegram, SMS nigdy nie przyjdzie</li>
                      <li>Jeśli masz włączone 2FA, poprosimy też o hasło</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSendCode}
                disabled={isLoading}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Wysyłanie kodu...
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-foreground/10">
                      <MessageSquare className="size-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Wyślij kod weryfikacyjny</p>
                      <p className="text-xs opacity-80">Otrzymasz kod przez aplikację Telegram lub SMS</p>
                    </div>
                  </div>
                )}
              </Button>

              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <p className="text-xs text-muted-foreground">
                  Kod zostanie wysłany na numer {bot.phone_number}. Sprawdź aplikację Telegram lub wiadomości SMS.
                </p>
              </div>
            </div>
          )}

          {step === "code" && (
            <div className="space-y-6 py-4">
              {helpText && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 animate-fade-in">
                  <div className="flex items-start gap-3">
                    {getCodeTypeIcon()}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-1">{helpText}</p>
                      {codeType === "SentCodeTypeApp" && (
                        <p className="text-xs text-muted-foreground">
                          Otwórz aplikację Telegram na swoim telefonie i sprawdź wiadomości od Telegram
                        </p>
                      )}
                      {codeType === "SentCodeTypeSms" && (
                        <p className="text-xs text-muted-foreground">
                          Sprawdź wiadomości SMS na numerze {bot.phone_number}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="code" className="text-foreground">
                  Kod weryfikacyjny
                </Label>
                <Input
                  id="code"
                  placeholder="12345"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                  autoFocus
                  className="h-12 text-center text-2xl font-mono tracking-widest bg-background/50 border-border/50 focus:border-primary/50"
                />
                <p className="text-xs text-muted-foreground text-center">
                  {codeType === "SentCodeTypeApp"
                    ? "Kod został wysłany przez aplikację Telegram"
                    : codeType === "SentCodeTypeSms"
                      ? "Kod został wysłany SMS-em"
                      : "Wprowadź otrzymany kod weryfikacyjny"}
                </p>
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
                  {error}
                </div>
              )}
              <Button
                onClick={handleVerifyCode}
                disabled={isLoading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Weryfikacja...
                  </>
                ) : (
                  <>
                    <CheckCircle className="size-4" />
                    Zweryfikuj kod
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "password" && (
            <div className="space-y-6 py-4">
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                <div className="flex items-center gap-2 text-warning mb-2">
                  <Key className="size-4" />
                  <span className="font-medium">Weryfikacja dwuetapowa</span>
                </div>
                <p className="text-sm text-muted-foreground">Twoje konto ma włączone 2FA. Wprowadź swoje hasło.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Hasło 2FA
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
                  autoFocus
                  className="h-12 bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
                  {error}
                </div>
              )}
              <Button
                onClick={handleVerifyPassword}
                disabled={isLoading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Weryfikacja...
                  </>
                ) : (
                  <>
                    <Shield className="size-4" />
                    Zweryfikuj hasło
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 animate-pulse-glow">
                <CheckCircle className="size-12 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-foreground">Autoryzacja pomyślna!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Twój bot jest teraz autoryzowany i gotowy do użycia
                </p>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="space-y-6 py-4">
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 space-y-3">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="size-5" />
                  <span className="font-medium">Wystąpił błąd</span>
                </div>
                <p className="text-sm text-muted-foreground">{error || "Wystąpił błąd podczas autoryzacji"}</p>
                {helpText && (
                  <div className="pt-3 border-t border-destructive/20">
                    <p className="text-xs text-muted-foreground">{helpText}</p>
                  </div>
                )}
              </div>
              <Button
                onClick={handleRetry}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Spróbuj ponownie
              </Button>
            </div>
          )}

          {step !== "success" && step !== "initial" && step !== "string-session" && (
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border/50">
                Anuluj
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
