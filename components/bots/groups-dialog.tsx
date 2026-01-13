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
import { Trash2, Plus, Download, RefreshCw, Users, Hash, MessageSquare, Calendar, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface Group {
  id: string
  group_id: string
  group_name: string
  messages_sent: number
  last_message_at: string | null
  enabled: boolean
}

interface DetectedGroup {
  group_id: string
  group_name: string
  is_channel: boolean
  is_group: boolean
  participant_count: number
}

interface GroupsDialogProps {
  botId: string
  botName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GroupsDialog({ botId, botName, open, onOpenChange }: GroupsDialogProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [detectedGroups, setDetectedGroups] = useState<DetectedGroup[]>([])
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [showDetected, setShowDetected] = useState(false)
  const [groupId, setGroupId] = useState("")
  const [groupName, setGroupName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const loadGroups = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("bot_groups")
      .select("*")
      .eq("bot_id", botId)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setGroups(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (open) {
      loadGroups()
      setShowDetected(false)
      setDetectedGroups([])
      setSelectedGroups(new Set())
    }
  }, [open, botId])

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error } = await supabase.from("bot_groups").insert([
        {
          bot_id: botId,
          group_id: groupId,
          group_name: groupName || `Group ${groupId}`,
          enabled: true,
        },
      ])

      if (error) throw error

      setGroupId("")
      setGroupName("")
      await loadGroups()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add group")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAutoDetectGroups = async () => {
    setError(null)
    setIsFetching(true)

    try {
      const response = await fetch("/api/telegram/groups/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch groups")
      }

      const data = await response.json()

      console.log("[v0] Groups response:", data)

      if (!data.groups || !Array.isArray(data.groups)) {
        throw new Error("Nieprawidłowa odpowiedź z serwera")
      }

      if (data.groups.length === 0) {
        throw new Error("Nie znaleziono żadnych grup na tym koncie")
      }

      setDetectedGroups(data.groups)
      setShowDetected(true)
      setSelectedGroups(new Set(data.groups.map((g: DetectedGroup) => g.group_id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to auto-detect groups")
    } finally {
      setIsFetching(false)
    }
  }

  const handleSaveSelectedGroups = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const groupsToInsert = detectedGroups
        .filter((g) => selectedGroups.has(g.group_id))
        .map((g) => ({
          bot_id: botId,
          group_id: g.group_id,
          group_name: g.group_name,
          enabled: true,
        }))

      if (groupsToInsert.length === 0) {
        setError("Wybierz przynajmniej jedną grupę")
        setIsLoading(false)
        return
      }

      const { error: insertError } = await supabase.from("bot_groups").upsert(groupsToInsert, {
        onConflict: "bot_id,group_id",
        ignoreDuplicates: false,
      })

      if (insertError) throw insertError

      await loadGroups()
      setShowDetected(false)
      setDetectedGroups([])
      setSelectedGroups(new Set())
      setError(`Pomyślnie dodano ${groupsToInsert.length} grup!`)
      setTimeout(() => setError(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save groups")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleGroupSelection = (groupId: string) => {
    const newSelected = new Set(selectedGroups)
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId)
    } else {
      newSelected.add(groupId)
    }
    setSelectedGroups(newSelected)
  }

  const handleToggleGroup = async (id: string, currentEnabled: boolean) => {
    const { error } = await supabase.from("bot_groups").update({ enabled: !currentEnabled }).eq("id", id)

    if (!error) {
      await loadGroups()
    }
  }

  const handleDeleteGroup = async (id: string) => {
    const { error } = await supabase.from("bot_groups").delete().eq("id", id)

    if (!error) {
      await loadGroups()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass border-border/50">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Grupy dla {botName}</DialogTitle>
              <DialogDescription>
                {showDetected
                  ? "Wybierz które grupy dodać z twojego konta Telegram"
                  : "Zarządzaj grupami do których bot wysyła wiadomości"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!showDetected ? (
            <>
              {/* Auto Detect Button */}
              <Button
                onClick={handleAutoDetectGroups}
                disabled={isFetching || isLoading}
                variant="outline"
                className="w-full h-12 border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all bg-transparent"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Wykrywanie grup...
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    Automatycznie wykryj grupy z Telegrama
                  </>
                )}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground">Lub dodaj ręcznie</span>
                </div>
              </div>

              {/* Manual Add Form */}
              <form onSubmit={handleAddGroup} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="group-id" className="flex items-center gap-2">
                      <Hash className="size-3" />
                      ID grupy
                    </Label>
                    <Input
                      id="group-id"
                      placeholder="-1001234567890 lub @nazwagrupy"
                      value={groupId}
                      onChange={(e) => setGroupId(e.target.value)}
                      required
                      className="bg-background/50 border-border/50 focus:border-primary/50"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="group-name">Nazwa (opcjonalnie)</Label>
                    <Input
                      id="group-name"
                      placeholder="Moja grupa"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="bg-background/50 border-border/50 focus:border-primary/50"
                    />
                  </div>
                </div>
                {error && (
                  <div
                    className={`p-3 rounded-lg text-sm animate-fade-in ${
                      error.includes("Pomyślnie")
                        ? "bg-primary/10 border border-primary/20 text-primary"
                        : "bg-destructive/10 border border-destructive/20 text-destructive"
                    }`}
                  >
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                >
                  <Plus className="size-4" />
                  Dodaj grupę
                </Button>
              </form>

              {/* Groups List */}
              <div className="border-t border-border/50 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" />
                    Twoje grupy
                    <span className="text-xs text-muted-foreground">({groups.length})</span>
                  </h3>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 text-muted-foreground animate-spin" />
                  </div>
                ) : groups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="size-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Brak dodanych grup</p>
                    <p className="text-xs">Użyj auto-wykrywania lub dodaj ręcznie</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          group.enabled
                            ? "bg-muted/30 border-border/50 hover:border-primary/30"
                            : "bg-muted/10 border-border/30 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            checked={group.enabled}
                            onCheckedChange={() => handleToggleGroup(group.id, group.enabled)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{group.group_name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{group.group_id}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MessageSquare className="size-3" />
                                {group.messages_sent} wysłanych
                              </span>
                              {group.last_message_at && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="size-3" />
                                  {new Date(group.last_message_at).toLocaleDateString("pl-PL")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteGroup(group.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Detected Groups View */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Znaleziono <span className="text-primary font-medium">{detectedGroups.length}</span> grup
                </p>
                <Button variant="ghost" size="sm" onClick={() => setShowDetected(false)}>
                  <RefreshCw className="size-4" />
                  Wróć
                </Button>
              </div>

              {error && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    error.includes("Pomyślnie")
                      ? "bg-primary/10 border border-primary/20 text-primary"
                      : "bg-destructive/10 border border-destructive/20 text-destructive"
                  }`}
                >
                  {error}
                </div>
              )}

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {detectedGroups.map((group) => (
                  <div
                    key={group.group_id}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedGroups.has(group.group_id)
                        ? "bg-primary/5 border-primary/30"
                        : "bg-muted/30 border-border/50 hover:border-primary/20"
                    }`}
                    onClick={() => toggleGroupSelection(group.group_id)}
                  >
                    <Checkbox
                      checked={selectedGroups.has(group.group_id)}
                      onCheckedChange={() => toggleGroupSelection(group.group_id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{group.group_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{group.group_id}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {group.is_channel && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            Kanał
                          </span>
                        )}
                        {group.is_group && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-500 border border-green-500/20">
                            Grupa
                          </span>
                        )}
                        {group.participant_count > 0 && (
                          <span className="text-xs text-muted-foreground">{group.participant_count} członków</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedGroups(new Set(detectedGroups.map((g) => g.group_id)))}
                  variant="outline"
                  className="flex-1 border-border/50"
                >
                  Zaznacz wszystkie
                </Button>
                <Button
                  onClick={() => setSelectedGroups(new Set())}
                  variant="outline"
                  className="flex-1 border-border/50"
                >
                  Odznacz wszystkie
                </Button>
              </div>

              <Button
                onClick={handleSaveSelectedGroups}
                disabled={isLoading || selectedGroups.size === 0}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Dodawanie...
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Dodaj {selectedGroups.size} zaznaczonych grup
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border/50">
            Zamknij
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
