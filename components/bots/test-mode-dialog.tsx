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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, TestTube2, Send } from "lucide-react"
import { toast } from "sonner"

interface TestModeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  botId: string
  botName: string
}

export function TestModeDialog({ open, onOpenChange, botId, botName }: TestModeDialogProps) {
  const [groupId, setGroupId] = useState("")
  const [testMessage, setTestMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSendTest = async () => {
    if (!groupId || !testMessage) {
      toast.error("Wypełnij wszystkie pola")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/telegram/bot/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botId,
          groupId,
          message: testMessage,
        }),
      })

      if (response.ok) {
        toast.success("Wiadomość testowa wysłana!")
        setGroupId("")
        setTestMessage("")
        onOpenChange(false)
      } else {
        const error = await response.json()
        toast.error(error.error || "Nie udało się wysłać wiadomości testowej")
      }
    } catch (error) {
      console.error("[v0] Test send error:", error)
      toast.error("Błąd podczas wysyłania")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border/50">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <TestTube2 className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Tryb testowy</DialogTitle>
              <DialogDescription>Wyślij testową wiadomość dla {botName}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="test-group-id">ID lub @username grupy</Label>
            <Input
              id="test-group-id"
              placeholder="-1001234567890 lub @mojagr upa"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="bg-background/50 border-border/50"
            />
            <p className="text-xs text-muted-foreground">Wprowadź ID grupy lub jej publiczny username</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-message">Wiadomość testowa</Label>
            <Textarea
              id="test-message"
              placeholder="To jest wiadomość testowa..."
              rows={4}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="bg-background/50 border-border/50 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border/50">
            Anuluj
          </Button>
          <Button
            onClick={handleSendTest}
            disabled={isLoading || !groupId || !testMessage}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Wysyłanie...
              </>
            ) : (
              <>
                <Send className="size-4" />
                Wyślij test
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
