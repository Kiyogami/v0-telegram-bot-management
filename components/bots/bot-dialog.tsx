"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { BotIcon, Key, Phone, MessageSquare, Clock, Loader2, Sparkles, ExternalLink, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Bot {
  id: string
  name: string
  api_id: string
  api_hash: string
  phone_number: string
  message_content: string | null
  min_delay: number
  max_delay: number
  auto_reply_message: string
  auto_reply_enabled: boolean
}

interface BotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBotSaved: () => void
  bot?: Bot | null
}

export function BotDialog({ open, onOpenChange, onBotSaved, bot }: BotDialogProps) {
  const [name, setName] = useState("")
  const [apiId, setApiId] = useState("")
  const [apiHash, setApiHash] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [message, setMessage] = useState("")
  const [autoReplyMessage, setAutoReplyMessage] = useState("To jest tylko bot. Pisz do @praskizbawiciel")
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true)
  const [minDelay, setMinDelay] = useState("20")
  const [maxDelay, setMaxDelay] = useState("40")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (bot) {
      setName(bot.name)
      setApiId(bot.api_id)
      setApiHash(bot.api_hash)
      setPhoneNumber(bot.phone_number)
      setMessage(bot.message_content || "")
      setAutoReplyMessage(bot.auto_reply_message || "To jest tylko bot. Pisz do @praskizbawiciel")
      setAutoReplyEnabled(bot.auto_reply_enabled ?? true)
      setMinDelay(bot.min_delay.toString())
      setMaxDelay(bot.max_delay.toString())
    } else {
      setName("")
      setApiId("")
      setApiHash("")
      setPhoneNumber("")
      setMessage("")
      setAutoReplyMessage("To jest tylko bot. Pisz do @praskizbawiciel")
      setAutoReplyEnabled(true)
      setMinDelay("20")
      setMaxDelay("40")
    }
    setError(null)
  }, [bot, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const botData = {
        name,
        api_id: apiId,
        api_hash: apiHash,
        phone_number: phoneNumber,
        message_content: message || null,
        auto_reply_message: autoReplyMessage,
        auto_reply_enabled: autoReplyEnabled,
        min_delay: Number.parseInt(minDelay),
        max_delay: Number.parseInt(maxDelay),
        user_id: user.id,
      }

      let result
      if (bot) {
        result = await supabase.from("bots").update(botData).eq("id", bot.id)
      } else {
        result = await supabase.from("bots").insert([botData])
      }

      if (result.error) throw result.error

      onBotSaved()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass border-border/50">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <BotIcon className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">{bot ? "Edytuj bota" : "Nowy bot"}</DialogTitle>
              <DialogDescription>
                {bot ? "Zaktualizuj konfigurację bota" : "Skonfiguruj swojego nowego bota Telegram"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BotIcon className="size-4" />
              Podstawowe informacje
            </div>
            <div className="grid gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="grid gap-2">
                <Label htmlFor="name">Nazwa bota</Label>
                <Input
                  id="name"
                  placeholder="Mój Bot"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>
            </div>
          </div>

          {/* API Credentials Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Key className="size-4" />
              Dane API Telegram
            </div>
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="size-4 text-primary" />
              <AlertDescription className="text-sm">
                Nie masz API credentials? Uzyskaj je za darmo na{" "}
                <a
                  href="https://my.telegram.org/auth"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                >
                  my.telegram.org
                  <ExternalLink className="size-3" />
                </a>{" "}
                (API development tools → Create application)
              </AlertDescription>
            </Alert>
            <div className="grid gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="api-id">API ID</Label>
                  <Input
                    id="api-id"
                    placeholder="123456789"
                    value={apiId}
                    onChange={(e) => setApiId(e.target.value)}
                    required
                    className="bg-background/50 border-border/50 focus:border-primary/50 font-mono"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="api-hash">API Hash</Label>
                  <Input
                    id="api-hash"
                    placeholder="abcdef1234567890"
                    value={apiHash}
                    onChange={(e) => setApiHash(e.target.value)}
                    required
                    className="bg-background/50 border-border/50 focus:border-primary/50 font-mono"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="size-3" />
                  Numer telefonu
                </Label>
                <Input
                  id="phone"
                  placeholder="+48123456789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Message Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MessageSquare className="size-4" />
              Wiadomość do grup
            </div>
            <div className="grid gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="grid gap-2">
                <Label htmlFor="message">Szablon wiadomości</Label>
                <Textarea
                  id="message"
                  placeholder="Wprowadź wiadomość do wysłania do grup..."
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary/50 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Auto Reply Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="size-4" />
              Automatyczna odpowiedź
            </div>
            <div className="grid gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-reply-enabled" className="cursor-pointer">
                    Odpowiadaj automatycznie na wiadomości prywatne
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">Bot odpowie na każdą prywatną wiadomość</p>
                </div>
                <Switch id="auto-reply-enabled" checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />
              </div>
              {autoReplyEnabled && (
                <div className="grid gap-2 animate-fade-in">
                  <Label htmlFor="auto-reply-message">Treść odpowiedzi</Label>
                  <Textarea
                    id="auto-reply-message"
                    placeholder="Wiadomość która zostanie wysłana w odpowiedzi..."
                    rows={3}
                    value={autoReplyMessage}
                    onChange={(e) => setAutoReplyMessage(e.target.value)}
                    className="bg-background/50 border-border/50 focus:border-primary/50 resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Delay Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="size-4" />
              Opóźnienia
            </div>
            <div className="grid md:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="grid gap-2">
                <Label htmlFor="min-delay">Min. opóźnienie (sekundy)</Label>
                <Input
                  id="min-delay"
                  type="number"
                  min="1"
                  value={minDelay}
                  onChange={(e) => setMinDelay(e.target.value)}
                  required
                  className="bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max-delay">Maks. opóźnienie (sekundy)</Label>
                <Input
                  id="max-delay"
                  type="number"
                  min="1"
                  value={maxDelay}
                  onChange={(e) => setMaxDelay(e.target.value)}
                  required
                  className="bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border/50">
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : bot ? (
                "Zaktualizuj bota"
              ) : (
                "Utwórz bota"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
