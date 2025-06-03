'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showBrowserHint, setShowBrowserHint] = useState(false)

  useEffect(() => {
    // Ellenőrizzük, hogy már telepítve van-e az app
    const checkIfInstalled = () => {
      // PWA telepítve van, ha standalone módban fut
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      // Vagy ha iOS-en home screen-ről indult
      const isIOSStandalone = (window.navigator as any).standalone === true
      
      setIsInstalled(isStandalone || isIOSStandalone)
    }

    checkIfInstalled()

    // beforeinstallprompt esemény figyelése
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('PWA: beforeinstallprompt event fired')
      // Megakadályozzuk az automatikus promptot
      e.preventDefault()
      // Eltároljuk az eseményt későbbi használatra
      setDeferredPrompt(e)
      
      // Várunk egy kicsit, hogy a user beöltözött legyen az oldalra
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true)
        }
      }, 3000) // 3 másodperc várakozás
    }

    // Ha nincs beforeinstallprompt, de PWA támogatott, mutassuk a böngésző hint-et
    const checkBrowserInstallOption = () => {
      setTimeout(() => {
        if (!deferredPrompt && !isInstalled && !showPrompt) {
          // Valószínűleg a böngésző natív telepítési opciója elérhető
          setShowBrowserHint(true)
        }
      }, 5000) // 5 másodperc után
    }

    // App telepítés után rejtjük el a promptot
    const handleAppInstalled = (e: Event) => {
      console.log('PWA: appinstalled event fired')
      setShowPrompt(false)
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    
    // Ellenőrizzük a böngésző telepítési opcióját
    checkBrowserInstallOption()

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInstalled])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('PWA: No deferred prompt available')
      return
    }

    console.log('PWA: Showing install prompt')
    // Megjelenítjük a telepítési promptot
    deferredPrompt.prompt()

    // Várjuk meg a user döntését
    const { outcome } = await deferredPrompt.userChoice
    console.log(`PWA: User choice: ${outcome}`)

    if (outcome === 'accepted') {
      console.log('PWA: User accepted the install prompt')
    } else {
      console.log('PWA: User dismissed the install prompt')
    }

    // Töröljük a tárolt promptot
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setShowBrowserHint(false)
    // Egy napig ne jelenjen meg újra
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
  }

  const handleBrowserInstall = () => {
    // Utasítások megjelenítése a böngésző natív telepítéséhez
    alert('A címsor jobb oldalán található + ikonra kattintva telepítheted az alkalmazást! Vagy használd a böngésző menüt: "Alkalmazás telepítése"')
    setShowBrowserHint(false)
  }

  // Ha már telepítve van, ne jelenítsük meg
  if (isInstalled) {
    return null
  }

  // Ellenőrizzük, hogy nem volt-e már elutasítva ma
  const dismissedTime = localStorage.getItem('pwa-prompt-dismissed')
  if (dismissedTime) {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
    if (parseInt(dismissedTime) > oneDayAgo) {
      return null
    }
  }

  // Ha van natív prompt, azt használjuk
  if (showPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
        <Card className="bg-white shadow-lg border-2 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  Telepítsd az alkalmazást
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Gyorsabb hozzáférés és offline használat lehetősége
                </p>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleInstallClick}
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Telepítés</span>
                  </Button>
                  
                  <Button 
                    onClick={handleDismiss}
                    variant="outline"
                    size="sm"
                  >
                    Később
                  </Button>
                </div>
              </div>
              
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Ha nincs natív prompt, de PWA támogatott, mutassuk a böngésző hint-et
  if (showBrowserHint) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
        <Card className="bg-white shadow-lg border-2 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-green-600" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  💡 Telepítési tipp
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Keresd a <strong>+ ikont a címsorban</strong> vagy a böngésző menü "Alkalmazás telepítése" opcióját
                </p>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleBrowserInstall}
                    size="sm"
                    variant="outline"
                    className="flex items-center space-x-1"
                  >
                    <span>🔍 Hol találom?</span>
                  </Button>
                  
                  <Button 
                    onClick={handleDismiss}
                    variant="outline"
                    size="sm"
                  >
                    Értem
                  </Button>
                </div>
              </div>
              
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}