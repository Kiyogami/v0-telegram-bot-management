"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { MessageSquare, Plus, Trash2, Save, Loader2, Shuffle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface MessagesListDialogProps {
  botId: string
  botName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MessagesListDialog({ botId, botName, open, onOpenChange }: MessagesListDialogProps) {
  const [messages, setMessages] = useState<string[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      loadMessages()
    }
  }, [open, botId])

  const loadMessages = async () => {
    setIsLoading(true)
    const { data } = await supabase.from("bots").select("messages_list, message_content").eq("id", botId).single()

    if (data) {
      // If messages_list exists, use it; otherwise use message_content as first message
      if (data.messages_list && data.messages_list.length > 0) {
        setMessages(data.messages_list)
      } else if (data.message_content) {
        setMessages([data.message_content])
      } else {
        setMessages([])
      }
    }
    setIsLoading(false)
  }

  const addMessage = () => {
    if (newMessage.trim()) {
      setMessages((prev) => [...prev, newMessage.trim()])
      setNewMessage("")
    }
  }

  const removeMessage = (index: number) => {
    setMessages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setIsSaving(true)

    const { error } = await supabase
      .from("bots")
      .update({
        messages_list: messages,
        message_content: messages[0] || null, // Keep first message as primary
      })
      .eq("id", botId)

    if (error) {
      toast.error("Nie udało się zapisać wiadomości")
    } else {
      toast.success("Lista wiadomości zapisana")
      onOpenChange(false)
    }

    setIsSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border/50 max-w-lg max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <MessageSquare className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Lista wiadomości</DialogTitle>
              <DialogDescription>{botName} - Bot losowo wybiera wiadomości</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info box */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm">
            <Shuffle className="size-4" />
            <span>Bot będzie losowo wybierał wiadomości z listy przy każdym wysyłaniu</span>
          </div>

          {/* Add new message */}
          <div className="space-y-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Wpisz nową wiadomość..."
              className="bg-muted/30 border-border/50 min-h-[80px]"
            />
            <Button
              onClick={addMessage}
              disabled={!newMessage.trim()}
              className="w-full bg-primary/10 text-primary hover:bg-primary/20"
            >
              <Plus className="size-4" />
              Dodaj wiadomość
            </Button>
          </div>

          {/* Messages list */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="size-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Brak wiadomości. Dodaj pierwszą!</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 group"
                >
                  <span className="text-xs text-muted-foreground font-mono mt-1">#{index + 1}</span>
                  <p className="flex-1 text-sm text-foreground whitespace-pre-wrap">{msg}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMessage(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">{messages.length} wiadomości na liście</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border/50">
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-primary">
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
