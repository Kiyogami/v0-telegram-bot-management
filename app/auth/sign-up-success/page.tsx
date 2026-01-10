import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-muted/30">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Dziękujemy za rejestrację!</CardTitle>
              <CardDescription>Sprawdź swój email aby potwierdzić konto</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Pomyślnie zarejestrowałeś się. Sprawdź swój email aby potwierdzić konto przed zalogowaniem.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
