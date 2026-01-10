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
import { Trash2, Plus, Download, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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

      if (!data.success || !data.groups) {
        throw new Error("No groups returned")
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
        setError("Please select at least one group")
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
      setError(`Successfully added ${groupsToInsert.length} groups!`)
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Groups for {botName}</DialogTitle>
          <DialogDescription>
            {showDetected
              ? "Select which groups to add from your Telegram account"
              : "Auto-detect groups from Telegram or manually add group IDs"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!showDetected ? (
            <>
              <Button
                onClick={handleAutoDetectGroups}
                disabled={isFetching || isLoading}
                variant="outline"
                className="w-full bg-transparent"
              >
                <Download className="size-4" />
                {isFetching ? "Detecting Groups..." : "Auto-Detect Groups from Telegram"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or add manually</span>
                </div>
              </div>

              <form onSubmit={handleAddGroup} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="group-id">Group ID (or username)</Label>
                    <Input
                      id="group-id"
                      placeholder="-1001234567890 or @groupname"
                      value={groupId}
                      onChange={(e) => setGroupId(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="group-name">Group Name (optional)</Label>
                    <Input
                      id="group-name"
                      placeholder="My Awesome Group"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>
                </div>
                {error && (
                  <p className={`text-sm ${error.includes("Successfully") ? "text-green-600" : "text-destructive"}`}>
                    {error}
                  </p>
                )}
                <Button type="submit" disabled={isLoading} className="w-full">
                  <Plus className="size-4" />
                  Add Group
                </Button>
              </form>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Your Groups ({groups.length})</h3>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Loading groups...</p>
                ) : groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No groups added yet. Use auto-detect or add manually.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                          group.enabled ? "hover:bg-accent/50" : "opacity-50 bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            checked={group.enabled}
                            onCheckedChange={() => handleToggleGroup(group.id, group.enabled)}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{group.group_name}</p>
                            <p className="text-sm text-muted-foreground">ID: {group.group_id}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="secondary">{group.messages_sent} messages sent</Badge>
                              {group.last_message_at && (
                                <Badge variant="outline">
                                  Last: {new Date(group.last_message_at).toLocaleDateString()}
                                </Badge>
                              )}
                              {!group.enabled && <Badge variant="destructive">Disabled</Badge>}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteGroup(group.id)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found {detectedGroups.length} groups. Select which ones to add:
                </p>
                <Button variant="ghost" size="sm" onClick={() => setShowDetected(false)}>
                  <RefreshCw className="size-4" />
                  Back
                </Button>
              </div>

              {error && (
                <p className={`text-sm ${error.includes("Successfully") ? "text-green-600" : "text-destructive"}`}>
                  {error}
                </p>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {detectedGroups.map((group) => (
                  <div
                    key={group.group_id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => toggleGroupSelection(group.group_id)}
                  >
                    <Checkbox
                      checked={selectedGroups.has(group.group_id)}
                      onCheckedChange={() => toggleGroupSelection(group.group_id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{group.group_name}</p>
                      <p className="text-sm text-muted-foreground">ID: {group.group_id}</p>
                      <div className="flex gap-2 mt-1">
                        {group.is_channel && <Badge variant="secondary">Channel</Badge>}
                        {group.is_group && <Badge variant="secondary">Group</Badge>}
                        {group.participant_count > 0 && (
                          <Badge variant="outline">{group.participant_count} members</Badge>
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
                  className="flex-1"
                >
                  Select All
                </Button>
                <Button onClick={() => setSelectedGroups(new Set())} variant="outline" className="flex-1">
                  Deselect All
                </Button>
              </div>

              <Button
                onClick={handleSaveSelectedGroups}
                disabled={isLoading || selectedGroups.size === 0}
                className="w-full"
              >
                <Plus className="size-4" />
                Add {selectedGroups.size} Selected Groups
              </Button>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
