"use client"

import type React from "react"
import { Textarea } from "@/components/ui/textarea"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, Shield, Key, Send, AlertCircle, MessageSquare, Upload, FileUp } from "lucide-react"

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

type AuthStep = "method" | "initial" | "code" | "password" | "string-session" | "import-session" | "success" | "error"

export function AuthDialog({ bot, open, onOpenChange, onAuthComplete }: AuthDialogProps) {
  const [step, setStep] = useState<AuthStep>("method")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [stringSession, setStringSession] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [helpText, setHelpText] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleSendCode = async () => {
    setIsLoading(true)
    setError(null)
    setHelpText(null)

    try {
      const response = await fetch("/api/telegram/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: bot.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send code")
      }

      if (data.message) {
        setHelpText(data.message)
      }

      setStep("code")
    } catch (err) {
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

  const handleImportSession = async () => {
    if (!selectedFile) {
      setError("Wybierz plik sesji")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("botId", bot.id)
      formData.append("sessionFile", selectedFile)

      const response = await fetch("/api/telegram/auth/import-session", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Nie udało się zaimportować sesji")
      }

      setStep("success")
      setTimeout(() => {
        onAuthComplete()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd importu sesji")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
    }
  }

  const handleRetry = () => {
    setStep("method")
    setCode("")
    setPassword("")
    setStringSession("")
    setSelectedFile(null)
    setError(null)
    setHelpText(null)
  }

  return (
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
                Import pliku .session to najszybsza opcja jeśli masz już gotową sesję
              </p>
            </div>

            <Button
              onClick={() => setStep("import-session")}
              className="w-full h-16 bg-green-600 hover:bg-green-700 text-white shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10">
                  <FileUp className="size-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Import pliku .session (Najszybsze)</p>
                  <p className="text-xs opacity-80">Masz pliki session_+48xxx.session? Użyj ich!</p>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => setStep("string-session")}
              className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-foreground/10">
                  <Key className="size-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">String Session</p>
                  <p className="text-xs opacity-80">Wklej string session z Telethon</p>
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
                  <p className="text-xs opacity-80">Otrzymaj kod weryfikacyjny</p>
                </div>
              </div>
            </Button>
          </div>
        )}

        {step === "import-session" && (
          <div className="space-y-6 py-4">
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-start gap-3">
                <FileUp className="size-4 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground mb-1">Import pliku sesji Telegram</p>
                  <p className="text-xs text-muted-foreground">
                    Wybierz plik <code className="bg-muted px-1 rounded">session_+48xxx.session</code> z Twojego
                    komputera
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <input ref={fileInputRef} type="file" accept=".session" onChange={handleFileSelect} className="hidden" />

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-20 border-dashed border-2 hover:bg-muted/50"
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="size-6 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedFile ? selectedFile.name : "Kliknij aby wybrać plik .session"}
                  </span>
                </div>
              </Button>

              {selectedFile && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
                  <p className="font-medium text-green-600">Wybrany plik: {selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rozmiar: {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                <p className="text-xs font-medium text-foreground mb-1">Gdzie znaleźć plik sesji?</p>
                <p className="text-xs text-muted-foreground">
                  Pliki sesji są tworzone przez Telethon w folderze gdzie uruchamiasz skrypt. Szukaj plików:{" "}
                  <code className="bg-muted px-1 rounded">session_+48517539241.session</code>
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("method")
                  setSelectedFile(null)
                }}
                className="flex-1 border-border/50"
              >
                Wstecz
              </Button>
              <Button
                onClick={handleImportSession}
                disabled={isLoading || !selectedFile}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Importowanie...
                  </>
                ) : (
                  <>
                    <CheckCircle className="size-4" />
                    Zaimportuj sesję
                  </>
                )}
              </Button>
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
                  <p className="text-xs text-muted-foreground">Wygeneruj String Session i wklej tutaj.</p>
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
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
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
                  <p className="text-sm font-medium text-foreground mb-2">Gdzie przyjdzie kod?</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>
                      Kod przyjdzie do <strong>aplikacji Telegram</strong> (nie SMS!)
                    </li>
                    <li>Sprawdź "Wiadomości od Telegram" w aplikacji</li>
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
                <>
                  <Send className="size-4" />
                  Wyślij kod weryfikacyjny
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("method")}
              className="w-full border-border/50"
            >
              Wstecz
            </Button>
          </div>
        )}

        {step === "code" && (
          <div className="space-y-6 py-4">
            {helpText && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <p className="text-sm">{helpText}</p>
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
                className="h-12 text-center text-2xl font-mono tracking-widest bg-background/50 border-border/50"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleVerifyCode}
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
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
              <p className="text-sm text-muted-foreground">Twoje konto ma włączone 2FA.</p>
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
                className="h-12 bg-background/50 border-border/50"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleVerifyPassword}
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
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
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <CheckCircle className="size-12 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground">Autoryzacja pomyślna!</h3>
              <p className="text-sm text-muted-foreground mt-1">Bot jest teraz gotowy do działania</p>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-6 py-4">
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
              <AlertCircle className="size-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <Button onClick={handleRetry} className="w-full">
              Spróbuj ponownie
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
