'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Download, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

export default function PWASettingsPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [swStatus, setSwStatus] = useState<'checking' | 'active' | 'inactive' | 'error'>('checking');
  const [cacheSize, setCacheSize] = useState<string>('Számítás...');

  useEffect(() => {
    // Online/offline állapot
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA telepítve ellenőrzés
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Service Worker állapot ellenőrzés
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.active) {
          setSwStatus('active');
        } else {
          setSwStatus('inactive');
        }
      }).catch(() => {
        setSwStatus('error');
      });

      // Cache méret számítás
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(({ usage, quota }) => {
          if (usage && quota) {
            const usedMB = (usage / 1024 / 1024).toFixed(2);
            const quotaMB = (quota / 1024 / 1024).toFixed(0);
            setCacheSize(`${usedMB} MB / ${quotaMB} MB`);
          }
        });
      }
    } else {
      setSwStatus('error');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleClearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      // Service Worker újraregisztráció
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
          await navigator.serviceWorker.register('/sw.js');
          window.location.reload();
        }
      }
    }
  };

  const handleUpdateSW = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        window.location.reload();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">PWA Beállítások</h1>
        <p className="text-gray-600">
          Progressive Web App funkciók és offline támogatás kezelése
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Állapot információk */}
        <Card>
          <CardHeader>
            <CardTitle>Alkalmazás állapot</CardTitle>
            <CardDescription>
              PWA és hálózati kapcsolat információk
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">Hálózati kapcsolat</span>
              </div>
              <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-gray-500" />
                <span className="font-medium">PWA telepítve</span>
              </div>
              <span className={isInstalled ? 'text-green-600' : 'text-gray-600'}>
                {isInstalled ? 'Igen' : 'Nem'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {swStatus === 'active' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : swStatus === 'error' ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Info className="h-5 w-5 text-gray-500" />
                )}
                <span className="font-medium">Service Worker</span>
              </div>
              <span className={
                swStatus === 'active' ? 'text-green-600' : 
                swStatus === 'error' ? 'text-red-600' : 
                'text-gray-600'
              }>
                {swStatus === 'active' ? 'Aktív' : 
                 swStatus === 'error' ? 'Hiba' : 
                 swStatus === 'inactive' ? 'Inaktív' : 
                 'Ellenőrzés...'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-gray-500" />
                <span className="font-medium">Cache méret</span>
              </div>
              <span className="text-gray-600">{cacheSize}</span>
            </div>
          </CardContent>
        </Card>

        {/* Műveletek */}
        <Card>
          <CardHeader>
            <CardTitle>PWA műveletek</CardTitle>
            <CardDescription>
              Service Worker és cache kezelés
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleUpdateSW}
              className="w-full"
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Service Worker frissítése
            </Button>

            <Button 
              onClick={handleClearCache}
              className="w-full"
              variant="outline"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cache törlése
            </Button>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                A cache törlése után az alkalmazás újratölti az összes erőforrást,
                ami időbe telhet lassú kapcsolat esetén.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* PWA funkciók */}
      <Card>
        <CardHeader>
          <CardTitle>PWA funkciók</CardTitle>
          <CardDescription>
            Az alkalmazás támogatja a következő Progressive Web App funkciókat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-medium">Offline támogatás</h3>
              <p className="text-sm text-gray-600">
                Az alkalmazás alapvető funkciói internetkapcsolat nélkül is működnek.
                A módosítások szinkronizálódnak, amikor újra online leszel.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Telepíthetőség</h3>
              <p className="text-sm text-gray-600">
                Telepítsd az alkalmazást az eszközödre a gyorsabb hozzáférésért
                és natív alkalmazás élményért.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Automatikus frissítés</h3>
              <p className="text-sm text-gray-600">
                Az alkalmazás automatikusan frissül a háttérben,
                így mindig a legújabb verziót használod.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Push értesítések</h3>
              <p className="text-sm text-gray-600">
                Kapj valós idejű értesítéseket fontos eseményekről,
                még akkor is, ha az alkalmazás nincs megnyitva.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}