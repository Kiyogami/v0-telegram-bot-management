"use client"

import type React from "react"

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
import { Download, Upload, FileJson } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface Bot {
  id: string
  name: string
  api_id: string
  api_hash: string
  phone_number: string
  message_content: string | null
  min_delay: number
  max_delay: number
  auto_reply_enabled?: boolean
  auto_reply_message?: string
}

interface ExportImportDialogProps {
  selectedBots: Bot[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}

export function ExportImportDialog({ selectedBots, open, onOpenChange, onImported }: ExportImportDialogProps) {
  const [isImporting, setIsImporting] = useState(false)
  const supabase = createClient()

  const handleExport = () => {
    const exportData = selectedBots.map((bot) => ({
      name: bot.name,
      api_id: bot.api_id,
      api_hash: bot.api_hash,
      phone_number: bot.phone_number,
      message_content: bot.message_content,
      min_delay: bot.min_delay,
      max_delay: bot.max_delay,
      auto_reply_enabled: bot.auto_reply_enabled,
      auto_reply_message: bot.auto_reply_message,
    }))

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bots-export-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success(`Wyeksportowano ${selectedBots.length} bot(ów)`)
    onOpenChange(false)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)

    try {
      const text = await file.text()
      const importedBots = JSON.parse(text)

      if (!Array.isArray(importedBots)) {
        throw new Error("Nieprawidłowy format pliku")
      }

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Nie jesteś zalogowany")

      let successCount = 0
      for (const bot of importedBots) {
        const { error } = await supabase.from("bots").insert({
          user_id: userData.user.id,
          name: bot.name,
          api_id: bot.api_id,
          api_hash: bot.api_hash,
          phone_number: bot.phone_number,
          message_content: bot.message_content,
          min_delay: bot.min_delay || 20,
          max_delay: bot.max_delay || 40,
          auto_reply_enabled: bot.auto_reply_enabled || false,
          auto_reply_message: bot.auto_reply_message,
          status: "stopped",
        })

        if (!error) successCount++
      }

      toast.success(`Zaimportowano ${successCount} z ${importedBots.length} bot(ów)`)
      onImported()
      onOpenChange(false)
    } catch (error) {
      toast.error("Nie udało się zaimportować: " + (error instanceof Error ? error.message : "Nieznany błąd"))
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border/50">
        <DialogHeader>
          <DialogTitle>Export / Import Botów</DialogTitle>
          <DialogDescription>
            Eksportuj konfigurację wybranych botów do pliku JSON lub zaimportuj boty z pliku.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="glass rounded-lg border border-border/50 p-4">
            <div className="flex items-center gap-3 mb-3">
              <FileJson className="size-5 text-primary" />
              <div>
                <h4 className="font-semibold text-foreground">Eksport</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedBots.length > 0
                    ? `Wybrano ${selectedBots.length} bot(ów)`
                    : "Zaznacz boty aby je wyeksportować"}
                </p>
              </div>
            </div>
            <Button onClick={handleExport} disabled={selectedBots.length === 0} className="w-full">
              <Download className="size-4" />
              Eksportuj do JSON
            </Button>
          </div>

          <div className="glass rounded-lg border border-border/50 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Upload className="size-5 text-primary" />
              <div>
                <h4 className="font-semibold text-foreground">Import</h4>
                <p className="text-sm text-muted-foreground">Importuj boty z pliku JSON</p>
              </div>
            </div>
            <label htmlFor="import-file">
              <Button type="button" disabled={isImporting} className="w-full" asChild>
                <span>
                  {isImporting ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {isImporting ? "Importowanie..." : "Wybierz plik JSON"}
                </span>
              </Button>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                disabled={isImporting}
              />
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Zamknij
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
