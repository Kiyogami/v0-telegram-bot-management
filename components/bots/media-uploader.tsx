"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ImageIcon, Video, X } from "lucide-react"
import { toast } from "sonner"

interface MediaUploaderProps {
  onMediaUploaded: (url: string, type: "image" | "video") => void
}

export function MediaUploader({ onMediaUploaded }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    const type = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : null
    if (!type) {
      toast.error("Tylko obrazy i wideo są wspierane")
      return
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Plik jest za duży (max 50MB)")
      return
    }

    setUploading(true)
    try {
      // Create preview
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
        setMediaType(type)
      }
      reader.readAsDataURL(file)

      // Here you would upload to Supabase Storage or similar
      // For now, we'll use the preview URL
      const url = URL.createObjectURL(file)

      toast.success("Plik przesłany pomyślnie!")
      onMediaUploaded(url, type)
    } catch (error) {
      toast.error("Błąd przesyłania pliku")
    } finally {
      setUploading(false)
    }
  }

  const clearMedia = () => {
    setPreview(null)
    setMediaType(null)
  }

  return (
    <div className="space-y-3">
      <Label>Media (opcjonalne)</Label>

      {preview ? (
        <div className="relative p-4 rounded-xl bg-muted/30 border border-border/50">
          <Button size="icon" variant="destructive" className="absolute top-2 right-2 size-8" onClick={clearMedia}>
            <X className="size-4" />
          </Button>

          {mediaType === "image" ? (
            <img src={preview || "/placeholder.svg"} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
          ) : (
            <video src={preview} className="w-full h-48 object-cover rounded-lg" controls />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-24 border-dashed bg-transparent"
            onClick={() => document.getElementById("image-upload")?.click()}
            disabled={uploading}
          >
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="size-6" />
              <span className="text-xs">Dodaj zdjęcie</span>
            </div>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-24 border-dashed bg-transparent"
            onClick={() => document.getElementById("video-upload")?.click()}
            disabled={uploading}
          >
            <div className="flex flex-col items-center gap-2">
              <Video className="size-6" />
              <span className="text-xs">Dodaj wideo</span>
            </div>
          </Button>
        </div>
      )}

      <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <input id="video-upload" type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
    </div>
  )
}
