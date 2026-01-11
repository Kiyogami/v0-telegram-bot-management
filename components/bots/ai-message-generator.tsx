"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Loader2, Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface AIMessageGeneratorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMessageGenerated: (message: string) => void
}

export function AIMessageGenerator({ open, onOpenChange, onMessageGenerated }: AIMessageGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [generatedMessage, setGeneratedMessage] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [tone, setTone] = useState("friendly")

  const generateMessage = async () => {
    if (!prompt.trim()) {
      toast.error("Wprowadź temat wiadomości")
      return
    }

    setIsGenerating(true)
    try {
      // Simulate AI generation (replace with actual AI API call)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const messages = {
        friendly: `Cześć! 👋\n\n${prompt}\n\nDaj znać jeśli masz pytania!`,
        professional: `Szanowni Państwo,\n\n${prompt}\n\nZ poważaniem,\nZespół`,
        casual: `Hej! ${prompt} 😊\n\nDo zobaczenia!`,
        urgent: `🚨 WAŻNE!\n\n${prompt}\n\nProszę o szybką odpowiedź!`,
      }

      setGeneratedMessage(messages[tone as keyof typeof messages])
      toast.success("Wiadomość wygenerowana!")
    } catch (error) {
      toast.error("Błąd generowania wiadomości")
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage)
    toast.success("Skopiowano do schowka!")
  }

  const useMessage = () => {
    onMessageGenerated(generatedMessage)
    onOpenChange(false)
    toast.success("Wiadomość dodana!")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glass border-border/50">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Sparkles className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Generator Wiadomości AI</DialogTitle>
              <DialogDescription>Wygeneruj profesjonalne wiadomości używając AI</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="prompt">O czym ma być wiadomość?</Label>
              <Input
                id="prompt"
                placeholder="np. promocja na nowe produkty..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-background/50 border-border/50"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tone">Ton wiadomości</Label>
              <select
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm"
              >
                <option value="friendly">Przyjazny</option>
                <option value="professional">Profesjonalny</option>
                <option value="casual">Casualowy</option>
                <option value="urgent">Pilny</option>
              </select>
            </div>

            <Button onClick={generateMessage} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generowanie...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Wygeneruj wiadomość
                </>
              )}
            </Button>
          </div>

          {generatedMessage && (
            <div className="space-y-3 animate-fade-in">
              <Label>Wygenerowana wiadomość</Label>
              <div className="relative">
                <Textarea
                  value={generatedMessage}
                  onChange={(e) => setGeneratedMessage(e.target.value)}
                  rows={6}
                  className="bg-background/50 border-border/50 pr-20"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button size="icon" variant="ghost" onClick={copyToClipboard}>
                    <Copy className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={generateMessage}>
                    <RefreshCw className="size-4" />
                  </Button>
                </div>
              </div>
              <Button onClick={useMessage} className="w-full bg-primary">
                Użyj tej wiadomości
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
