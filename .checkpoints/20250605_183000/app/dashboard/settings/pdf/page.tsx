/**
 * @file PDF Export Test Page
 * @description Test interface for PDF export functionality
 * @created 2025-05-28
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, FileText, Printer, Download } from 'lucide-react';
import { usePDFExport } from '@/src/hooks/use-pdf-export';

export default function PDFTestPage() {
  const { exportHTML, downloadHTML, isExporting, error } = usePDFExport();
  const [lastAction, setLastAction] = useState<string>('');

  const handleTestOfferPrint = async () => {
    setLastAction('print');
    await exportHTML({ type: 'test' });
  };

  const handleTestOfferDownload = async () => {
    setLastAction('download');
    await downloadHTML({ type: 'test' }, 'teszt-ajanlat.html');
  };

  const handleTestReport = async () => {
    setLastAction('report');
    await exportHTML({
      type: 'report',
      data: {
        title: 'Havi Ingatlan Jelentés',
        period: '2025. január',
        data: [
          { label: 'Összes ingatlan', value: 25, type: 'number' },
          { label: 'Kiadott ingatlanok', value: 22, type: 'number' },
          { label: 'Havi bevétel', value: 125000, type: 'currency' },
          { label: 'Átlagos bérleti díj', value: 850, type: 'currency' },
          { label: 'Kihasználtság', value: '88%', type: 'text' }
        ],
        charts: [
          {
            title: 'Ingatlan típusok megoszlása',
            data: [
              { label: 'Lakás', value: 15 },
              { label: 'Ház', value: 8 },
              { label: 'Iroda', value: 2 }
            ]
          }
        ]
      }
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">PDF Export Teszt</h1>
          <p className="text-muted-foreground">PDF export funkcionalitás tesztelése</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && lastAction && !isExporting && (
        <Alert className="border-green-500">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {lastAction === 'print' && 'Nyomtatási ablak megnyitva!'}
            {lastAction === 'download' && 'HTML fájl letöltve!'}
            {lastAction === 'report' && 'Jelentés megnyitva nyomtatáshoz!'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offer Export Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Ajánlat Export Teszt
            </CardTitle>
            <CardDescription>
              Tesztelje az ajánlat PDF export funkcióját
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ez egy teszt ajánlatot generál a következő adatokkal:
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Ajánlat száma: TEST-2025-001</li>
                <li>• Vízcsap javítás (1x 15.000 EUR)</li>
                <li>• Csővezeték ellenőrzés (2x 8.000 EUR)</li>
                <li>• Végösszeg: 31.000 EUR</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleTestOfferPrint}
                disabled={isExporting}
                className="flex-1"
              >
                <Printer className="mr-2 h-4 w-4" />
                {isExporting && lastAction === 'print' ? 'Megnyitás...' : 'Nyomtatás'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleTestOfferDownload}
                disabled={isExporting}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting && lastAction === 'download' ? 'Letöltés...' : 'HTML Letöltés'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Export Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Jelentés Export Teszt
            </CardTitle>
            <CardDescription>
              Tesztelje a jelentés PDF export funkcióját
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ez egy teszt havi jelentést generál a következő adatokkal:
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 25 összes ingatlan</li>
                <li>• 22 kiadott ingatlan</li>
                <li>• 125.000 EUR havi bevétel</li>
                <li>• 88% kihasználtság</li>
                <li>• Ingatlan típusok megoszlása</li>
              </ul>
            </div>

            <Button 
              onClick={handleTestReport}
              disabled={isExporting}
              className="w-full"
            >
              <Printer className="mr-2 h-4 w-4" />
              {isExporting && lastAction === 'report' ? 'Megnyitás...' : 'Jelentés Nyomtatás'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Használati útmutató</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">📄 PDF mentés böngészőből:</h4>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Kattints a "Nyomtatás" gombra</li>
                <li>2. A megnyíló ablakban nyomd meg Cmd+P (Mac) vagy Ctrl+P (Windows)</li>
                <li>3. Válaszd a "Save as PDF" opciót</li>
                <li>4. Add meg a fájl nevét és mentsd el</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-2">💻 HTML letöltés:</h4>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Kattints a "HTML Letöltés" gombra</li>
                <li>2. A HTML fájl automatikusan letöltődik</li>
                <li>3. Megnyithatod böngészőben</li>
                <li>4. Innen mentheted PDF-ként</li>
              </ol>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Fontos:</strong> A PDF export fejlesztői módban működik. 
              Éles környezetben fontold meg egy dedikált PDF szolgáltatás használatát 
              (pl. Puppeteer, wkhtmltopdf) a jobb minőség érdekében.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}