"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, QrCode, XCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface QRAuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  botId: string
  apiId: string
  apiHash: string
  onSuccess: (sessionString: string) => void
}

export function QRAuthDialog({ open, onOpenChange, botId, apiId, apiHash, onSuccess }: QRAuthDialogProps) {
  const [qrCode, setQrCode] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string>("")
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup intervals
  const cleanup = () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
      checkIntervalRef.current = null
    }
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current)
      timeIntervalRef.current = null
    }
  }

  // Generate QR code
  const generateQR = async () => {
    cleanup()
    setLoading(true)
    setQrCode("")
    setChecking(false)
    setError("")

    try {
      const response = await fetch("/api/telegram/auth/qr-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId, apiId, apiHash }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Nie udało się wygenerować QR")
      }

      const qrDataUrl = `data:image/png;base64,${data.qr_code}`
      setQrCode(qrDataUrl)
      setTimeLeft(data.expires_in || 60)
      setChecking(true)

      // Start checking for scan
      checkIntervalRef.current = setInterval(checkQRStatus, 2000)

      // Start countdown
      timeIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            cleanup()
            setChecking(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      toast.success("QR kod gotowy!", {
        description: "Zeskanuj w aplikacji Telegram",
      })
    } catch (err: any) {
      setError(err.message)
      toast.error("Błąd", { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  // Check if QR was scanned
  const checkQRStatus = async () => {
    try {
      const response = await fetch("/api/telegram/auth/qr-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId }),
      })

      const data = await response.json()

      if (data.authorized && data.session_string) {
        cleanup()
        setChecking(false)
        toast.success("Zalogowano!")
        onSuccess(data.session_string)
        onOpenChange(false)
      } else if (data.requires_password) {
        cleanup()
        setChecking(false)
        toast.error("Wymagane hasło 2FA", {
          description: "Użyj logowania przez kod SMS",
        })
      }
    } catch (err) {
      // Silent fail - keep checking
    }
  }

  // Auto-generate on open
  useEffect(() => {
    if (open && !qrCode && !loading) {
      generateQR()
    }
    return cleanup
  }, [open])

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      cleanup()
      setQrCode("")
      setChecking(false)
      setError("")
    }
  }, [open])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Logowanie przez QR kod
          </DialogTitle>
          <DialogDescription>Zeskanuj kod w aplikacji Telegram</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code */}
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg min-h-[280px]">
            {loading && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
                <p className="text-sm text-gray-500">Generowanie...</p>
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center gap-3 text-center">
                <XCircle className="h-12 w-12 text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
                <Button onClick={generateQR} size="sm">
                  Spróbuj ponownie
                </Button>
              </div>
            )}

            {qrCode && !loading && !error && (
              <div className="space-y-3 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCode || "/placeholder.svg"}
                  alt="QR Code"
                  width={220}
                  height={220}
                  className="rounded border"
                />

                {timeLeft > 0 ? (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">
                      Wygasa za: <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                    </p>
                    {checking && (
                      <div className="flex items-center justify-center gap-2 text-xs text-blue-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Oczekiwanie na skanowanie...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-xs text-red-600">
                    <XCircle className="h-3 w-3" />
                    Kod wygasł
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Jak się zalogować:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Otwórz Telegram na telefonie</li>
              <li>Ustawienia → Urządzenia → Połącz urządzenie</li>
              <li>Zeskanuj kod QR</li>
            </ol>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={generateQR} disabled={loading} className="flex-1 bg-transparent">
              <RefreshCw className="h-4 w-4 mr-2" />
              Nowy kod
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Anuluj
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
