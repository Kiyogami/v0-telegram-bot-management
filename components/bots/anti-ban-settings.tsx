"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Shield, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AntiBanSettingsProps {
  randomDelay: boolean
  setRandomDelay: (value: boolean) => void
  dailyLimit: string
  setDailyLimit: (value: string) => void
  respectFloodWait: boolean
  setRespectFloodWait: (value: boolean) => void
}

export function AntiBanSettings({
  randomDelay,
  setRandomDelay,
  dailyLimit,
  setDailyLimit,
  respectFloodWait,
  setRespectFloodWait,
}: AntiBanSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Shield className="size-4" />
        Ochrona Anti-Ban
      </div>

      <Alert className="bg-warning/10 border-warning/20">
        <AlertTriangle className="size-4 text-warning" />
        <AlertDescription className="text-sm text-muted-foreground">
          Te ustawienia pomagają uniknąć banów od Telegram. Zalecamy włączenie wszystkich opcji.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="random-delay">Losowe opóźnienia</Label>
            <p className="text-xs text-muted-foreground">Dodaj losowość do czasu między wiadomościami</p>
          </div>
          <Switch id="random-delay" checked={randomDelay} onCheckedChange={setRandomDelay} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="respect-flood">Respektuj FloodWait</Label>
            <p className="text-xs text-muted-foreground">Automatycznie czekaj gdy Telegram nałoży limit</p>
          </div>
          <Switch id="respect-flood" checked={respectFloodWait} onCheckedChange={setRespectFloodWait} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="daily-limit">Dzienny limit wiadomości</Label>
          <Input
            id="daily-limit"
            type="number"
            placeholder="100"
            value={dailyLimit}
            onChange={(e) => setDailyLimit(e.target.value)}
            className="bg-background/50 border-border/50"
          />
          <p className="text-xs text-muted-foreground">Maksymalna liczba wiadomości dziennie (0 = bez limitu)</p>
        </div>
      </div>
    </div>
  )
}
