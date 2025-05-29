import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Elfelejtett jelszó
          </CardTitle>
          <CardDescription className="text-center">
            Ez a funkció még nem elérhető
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Kérjük vegye fel a kapcsolatot az adminisztrátorral a jelszó visszaállításához.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">
              Vissza a bejelentkezéshez
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}