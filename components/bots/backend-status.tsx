"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
      <Alert>
        <Loader2 className="size-4 animate-spin" />
        <AlertTitle>Sprawdzanie połączenia...</AlertTitle>
        <AlertDescription>Łączenie z Python backendem</AlertDescription>
      </Alert>
    )
  }

  if (status === "disconnected") {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Python backend nie jest dostępny</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>Backend musi być uruchomiony, aby boty mogły działać. {backendUrl && `URL: ${backendUrl}`}</p>
          <div className="mt-2 text-xs space-y-1">
            <p className="font-semibold">Jak uruchomić backend:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Pobierz folder python-backend z projektu</li>
              <li>Wdróż na Railway.app, Render.com lub Fly.io</li>
              <li className="font-bold text-red-600">
                Dodaj PUBLICZNY URL Railway jako PYTHON_BACKEND_URL (np. https://twoj-backend.up.railway.app)
              </li>
              <li>NIE używaj URL zakończonego na .railway.internal - to URL wewnętrzny</li>
            </ol>
            <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded text-yellow-800 dark:text-yellow-200">
              <p className="font-semibold">Jak znaleźć publiczny URL Railway:</p>
              <ol className="list-decimal list-inside ml-2 mt-1">
                <li>Otwórz projekt na Railway.app</li>
                <li>Kliknij na serwis Python backend</li>
                <li>Przejdź do zakładki Settings</li>
                <li>W sekcji Networking kliknij Generate Domain</li>
                <li>Skopiuj wygenerowany URL (np. python-backend-production-xxxx.up.railway.app)</li>
              </ol>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-green-500/50 bg-green-500/10">
      <CheckCircle className="size-4 text-green-500" />
      <AlertTitle className="text-green-700 dark:text-green-400">Backend połączony</AlertTitle>
      <AlertDescription className="text-green-600 dark:text-green-300">
        Python backend działa poprawnie. {backendUrl && `(${backendUrl})`}
      </AlertDescription>
    </Alert>
  )
}
