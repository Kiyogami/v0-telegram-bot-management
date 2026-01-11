"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Clock, Calendar, Save, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface ScheduleConfigProps {
  botId: string
  botName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: {
    schedule_enabled: boolean
    schedule_start_hour: number
    schedule_end_hour: number
    schedule_days: string
    daily_message_limit: number
  }
}

const DAYS = [
  { id: "mon", label: "Pn" },
  { id: "tue", label: "Wt" },
  { id: "wed", label: "Śr" },
  { id: "thu", label: "Cz" },
  { id: "fri", label: "Pt" },
  { id: "sat", label: "So" },
  { id: "sun", label: "Nd" },
]

export function ScheduleConfig({ botId, botName, open, onOpenChange, initialData }: ScheduleConfigProps) {
  const [enabled, setEnabled] = useState(initialData?.schedule_enabled ?? false)
  const [startHour, setStartHour] = useState(initialData?.schedule_start_hour ?? 8)
  const [endHour, setEndHour] = useState(initialData?.schedule_end_hour ?? 22)
  const [selectedDays, setSelectedDays] = useState<string[]>(
    initialData?.schedule_days?.split(",") ?? ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  )
  const [dailyLimit, setDailyLimit] = useState(initialData?.daily_message_limit ?? 100)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const toggleDay = (dayId: string) => {
    setSelectedDays((prev) => (prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]))
  }

  const handleSave = async () => {
    setIsSaving(true)

    const { error } = await supabase
      .from("bots")
      .update({
        schedule_enabled: enabled,
        schedule_start_hour: startHour,
        schedule_end_hour: endHour,
        schedule_days: selectedDays.join(","),
        daily_message_limit: dailyLimit,
      })
      .eq("id", botId)

    if (error) {
      toast.error("Nie udało się zapisać harmonogramu")
    } else {
      toast.success("Harmonogram zapisany")
      onOpenChange(false)
    }

    setIsSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border/50 max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Clock className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Harmonogram wysyłania</DialogTitle>
              <DialogDescription>{botName}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable schedule */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3">
              <Calendar className="size-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Włącz harmonogram</p>
                <p className="text-sm text-muted-foreground">Bot będzie aktywny tylko w określonych godzinach</p>
              </div>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {enabled && (
            <>
              {/* Time range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Godzina startu</Label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="bg-muted/30 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Godzina końca</Label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={endHour}
                    onChange={(e) => setEndHour(Number(e.target.value))}
                    className="bg-muted/30 border-border/50"
                  />
                </div>
              </div>

              {/* Days of week */}
              <div className="space-y-2">
                <Label>Dni tygodnia</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedDays.includes(day.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Daily limit */}
              <div className="space-y-2">
                <Label>Dzienny limit wiadomości</Label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  className="bg-muted/30 border-border/50"
                />
                <p className="text-xs text-muted-foreground">Bot przestanie wysyłać po osiągnięciu limitu</p>
              </div>
            </>
          )}
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
