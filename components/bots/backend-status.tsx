"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle, Loader2, Server, ExternalLink } from "lucide-react"

export function BackendStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "disconnected">("checking")
  const [backendUrl, setBackendUrl] = useState<string>("")

  useEffect(() => {
    checkBackendStatus()
  }, [])

  const checkBackendStatus = async () => {
    setStatus("checking")
    try {
      const response = await fetch("/api/telegram/health")
      const data = await response.json()

      if (data.backend_status === "ok") {
        setStatus("connected")
        setBackendUrl(data.backend_url)
      } else {
        setStatus("disconnected")
        setBackendUrl(data.backend_url)
      }
    } catch (error) {
      setStatus("disconnected")
    }
  }

  if (status === "checking") {
    return (
      <div className="glass rounded-xl border border-border/50 p-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted/50">
            <Loader2 className="size-5 text-muted-foreground animate-spin" />
          </div>
          <div>
            <p className="font-medium text-foreground">Sprawdzanie połączenia...</p>
            <p className="text-sm text-muted-foreground">Łączenie z Python backendem</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === "disconnected") {
    return (
      <div className="glass rounded-xl border border-destructive/30 bg-destructive/5 p-4 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <AlertCircle className="size-5 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Python backend niedostępny</p>
            <p className="text-sm text-muted-foreground mt-1">
              Backend musi być uruchomiony, aby boty mogły działać.
              {backendUrl && <span className="font-mono text-xs ml-1">({backendUrl})</span>}
            </p>

            <div className="mt-4 p-4 rounded-lg bg-background/50 border border-border/50 space-y-3">
              <div className="flex items-center gap-2">
                <Server className="size-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Jak uruchomić backend:</p>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                <li>
                  Pobierz folder{" "}
                  <code className="px-1 py-0.5 rounded bg-muted text-foreground text-xs">python-backend</code> z
                  projektu
                </li>
                <li>Wdróż na Railway.app, Render.com lub Fly.io</li>
                <li>
                  <span className="text-primary font-medium">Dodaj PUBLICZNY URL</span> jako{" "}
                  <code className="px-1 py-0.5 rounded bg-muted text-foreground text-xs">PYTHON_BACKEND_URL</code>
                </li>
              </ol>

              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 mt-3">
                <p className="text-xs text-warning font-medium mb-2">Jak znaleźć publiczny URL Railway:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
                  <li>Otwórz projekt na Railway.app</li>
                  <li>Kliknij na serwis → Settings → Networking</li>
                  <li>Kliknij "Generate Domain"</li>
                  <li>
                    Skopiuj URL (np. <code className="text-foreground">xxx.up.railway.app</code>)
                  </li>
                </ol>
              </div>

              <a
                href="https://railway.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Otwórz Railway.app
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl border border-primary/30 bg-primary/5 p-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <CheckCircle className="size-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">Backend połączony</p>
          <p className="text-sm text-muted-foreground">
            Python backend działa poprawnie
            {backendUrl && <span className="font-mono text-xs ml-1 text-primary">({backendUrl})</span>}
          </p>
        </div>
      </div>
    </div>
  )
}
