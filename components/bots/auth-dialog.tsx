"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle } from "lucide-react"

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

type AuthStep = "initial" | "code" | "password" | "success" | "error"

export function AuthDialog({ bot, open, onOpenChange, onAuthComplete }: AuthDialogProps) {
  const [step, setStep] = useState<AuthStep>("initial")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [helpText, setHelpText] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
        if (data.helpText) {
          setHelpText(data.helpText)
        }
        throw new Error(data.error || "Failed to send code")
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
      setError("Please enter the verification code")
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
      setError("Please enter your 2FA password")
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

  const handleRetry = () => {
    setStep("initial")
    setCode("")
    setPassword("")
    setError(null)
    setHelpText(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Authorize {bot.name}</DialogTitle>
          <DialogDescription>Authorize your Telegram bot to start sending messages</DialogDescription>
        </DialogHeader>

        {step === "initial" && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Click the button below to receive a verification code on <strong>{bot.phone_number}</strong>
            </p>
            <Button onClick={handleSendCode} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending code...
                </>
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </div>
        )}

        {step === "code" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                placeholder="12345"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">Enter the code sent to {bot.phone_number}</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleVerifyCode} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
          </div>
        )}

        {step === "password" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">2FA Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">Your account has 2FA enabled. Please enter your password.</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleVerifyPassword} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Password"
              )}
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="size-16 text-green-500" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Authorization Successful!</h3>
              <p className="text-sm text-muted-foreground mt-1">Your bot is now authorized and ready to use</p>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4 py-4">
            <div className="bg-destructive/10 text-destructive rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold">{error || "An error occurred during authorization"}</p>
              {helpText && (
                <div className="border-t border-destructive/20 pt-3 mt-3">
                  <p className="text-xs text-destructive/90 font-medium mb-2">Jak to naprawić:</p>
                  <p className="text-xs text-destructive/80">{helpText}</p>
                  <div className="mt-3 bg-background/50 rounded p-2 text-xs space-y-1">
                    <p className="font-medium">Kroki do uruchomienia Python backendu:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>Pobierz projekt z v0 (Download ZIP lub GitHub)</li>
                      <li>Przejdź do folderu python-backend</li>
                      <li>Wdróż na Railway.app lub Render.com</li>
                      <li>Skopiuj URL backendu i dodaj jako PYTHON_BACKEND_URL</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
            <Button onClick={handleRetry} className="w-full">
              Try Again
            </Button>
          </div>
        )}

        {step !== "success" && step !== "initial" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
