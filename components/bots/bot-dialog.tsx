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

interface Bot {
  id: string
  name: string
  api_id: string
  api_hash: string
  phone_number: string
  message_content: string | null
  min_delay: number
  max_delay: number
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
      setMinDelay(bot.min_delay.toString())
      setMaxDelay(bot.max_delay.toString())
    } else {
      setName("")
      setApiId("")
      setApiHash("")
      setPhoneNumber("")
      setMessage("")
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bot ? "Edit Bot" : "Add New Bot"}</DialogTitle>
          <DialogDescription>
            {bot ? "Update your bot configuration" : "Configure your new Telegram bot"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Bot Name</Label>
              <Input id="name" placeholder="My Bot" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="api-id">API ID</Label>
              <Input
                id="api-id"
                placeholder="123456789"
                value={apiId}
                onChange={(e) => setApiId(e.target.value)}
                required
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
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message Template</Label>
              <Textarea
                id="message"
                placeholder="Enter the message to send to groups..."
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="min-delay">Min Delay (seconds)</Label>
                <Input
                  id="min-delay"
                  type="number"
                  min="1"
                  value={minDelay}
                  onChange={(e) => setMinDelay(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max-delay">Max Delay (seconds)</Label>
                <Input
                  id="max-delay"
                  type="number"
                  min="1"
                  value={maxDelay}
                  onChange={(e) => setMaxDelay(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : bot ? "Update Bot" : "Create Bot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
