/**
 * @file Email Settings Page
 * @description Email configuration and testing interface
 * @created 2025-05-28
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Mail, Send } from 'lucide-react';

export default function EmailSettingsPage() {
  const [testEmail, setTestEmail] = useState('');
  const [emailType, setEmailType] = useState('issue');
  const [testData, setTestData] = useState({ name: '', role: 'TENANT' });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; error?: string } | null>(null);

  const handleTestEmail = async () => {
    if (!testEmail) {
      setResult({ success: false, message: 'Email cím megadása kötelező!' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: emailType,
          to: testEmail,
          data: emailType === 'welcome' ? testData : undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult({ 
          success: true, 
          message: data.message || 'Email sikeresen elküldve!' 
        });
      } else {
        setResult({ 
          success: false, 
          message: data.error || 'Hiba történt az email küldése során.',
          error: data.details 
        });
      }
    } catch (error) {
      setResult({ 
        success: false, 
        message: 'Hálózati hiba történt.',
        error: error instanceof Error ? error.message : 'Ismeretlen hiba'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Email Beállítások</h1>
          <p className="text-muted-foreground">Email értesítések konfigurálása és tesztelése</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Email Tesztelés
            </CardTitle>
            <CardDescription>
              Tesztelje az email értesítések működését
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email cím</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-type">Email típus</Label>
              <Select value={emailType} onValueChange={setEmailType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="issue">Hibabejelentés értesítés</SelectItem>
                  <SelectItem value="welcome">Üdvözlő email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {emailType === 'welcome' && (
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium">Üdvözlő email beállítások</h4>
                <div className="space-y-2">
                  <Label htmlFor="welcome-name">Felhasználó neve</Label>
                  <Input
                    id="welcome-name"
                    placeholder="Teszt Felhasználó"
                    value={testData.name}
                    onChange={(e) => setTestData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="welcome-role">Szerepkör</Label>
                  <Select value={testData.role} onValueChange={(role) => setTestData(prev => ({ ...prev, role }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="OWNER">Tulajdonos</SelectItem>
                      <SelectItem value="TENANT">Bérlő</SelectItem>
                      <SelectItem value="PROVIDER">Szolgáltató</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Button 
              onClick={handleTestEmail} 
              disabled={isLoading || !testEmail}
              className="w-full"
            >
              {isLoading ? 'Küldés...' : 'Teszt Email Küldése'}
            </Button>

            {result && (
              <Alert className={result.success ? 'border-green-500' : 'border-red-500'}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className="font-medium">
                    {result.message}
                  </AlertDescription>
                </div>
                {result.error && (
                  <AlertDescription className="mt-2 text-sm text-muted-foreground">
                    Részletek: {result.error}
                  </AlertDescription>
                )}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Email Konfiguráció</CardTitle>
            <CardDescription>
              Jelenlegi email beállítások
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">Email szolgáltató:</span>
                <span className="text-muted-foreground">Resend</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium">Fejlesztői mód:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  process.env.NODE_ENV === 'development' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {process.env.NODE_ENV === 'development' ? 'Igen' : 'Nem'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium">Feladó email:</span>
                <span className="text-muted-foreground">noreply@molino-rental.com</span>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {process.env.NODE_ENV === 'development' 
                  ? 'Fejlesztői módban az emailek a konzolba kerülnek kiírásra, nem kerülnek ténylegesen elküldésre.'
                  : 'Éles módban az emailek ténylegesen elküldésre kerülnek a megadott címekre.'
                }
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Email Sablonok</CardTitle>
          <CardDescription>
            Elérhető email értesítési típusok
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-sm">🔧 Hibabejelentés</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Új hibabejelentés létrehozásakor küldjük el a tulajdonosnak
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-sm">🔄 Státusz változás</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Hibabejelentés státuszának változásakor
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-sm">👷 Hozzárendelés</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Feladat szolgáltatóhoz rendelésekor
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-sm">🏠 Üdvözlő email</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Új felhasználó regisztrációjakor
              </p>
            </div>
            <div className="p-4 border rounded-lg opacity-50">
              <h4 className="font-medium text-sm">💼 Ajánlat (tervezett)</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Új ajánlat létrehozásakor
              </p>
            </div>
            <div className="p-4 border rounded-lg opacity-50">
              <h4 className="font-medium text-sm">📋 Szerződés (tervezett)</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Szerződés létrehozása vagy módosítása
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}