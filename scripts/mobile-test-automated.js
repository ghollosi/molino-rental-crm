/**
 * Automatikus Mobil Teszt Script
 * Böngésző konzolon futtatható script a mobil optimalizáció tesztelésére
 */

// 📱 Mobil Teszt Utility Funkciók
const MobileTest = {
  
  // 📏 Viewport méret változtatás
  setViewport(width, height, deviceName = '') {
    const meta = document.querySelector('meta[name="viewport"]');
    console.log(`🔧 Viewport beállítva: ${width}x${height} ${deviceName ? `(${deviceName})` : ''}`);
    
    // Szimulált viewport (csak vizuális segítség)
    document.body.style.width = width + 'px';
    document.body.style.margin = '0 auto';
    document.body.style.border = '2px solid #ff6b6b';
    document.body.style.boxSizing = 'border-box';
    
    return { width, height, deviceName };
  },

  // 🎯 Touch target méret ellenőrzés
  checkTouchTargets() {
    const minSize = 44; // 44px minimum iOS guideline
    const elements = document.querySelectorAll('button, a, input, [role="button"]');
    const issues = [];
    
    elements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      const computed = window.getComputedStyle(el);
      
      if (rect.width < minSize || rect.height < minSize) {
        issues.push({
          element: el,
          size: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
          text: el.textContent?.trim().substring(0, 30) || el.className,
          padding: computed.padding
        });
      }
    });
    
    console.log(`🎯 Touch Target Ellenőrzés: ${elements.length} elem vizsgálva`);
    
    if (issues.length > 0) {
      console.warn(`⚠️ ${issues.length} elem túl kicsi touch használatra:`);
      issues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.size} - "${issue.text}"`);
        issue.element.style.outline = '2px solid orange';
      });
    } else {
      console.log('✅ Minden touch target megfelelő méretű');
    }
    
    return issues;
  },

  // 📝 Typography teszt
  checkTypography() {
    const minMobileFontSize = 14; // 14px minimum mobil olvashatóság
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, li, td, th, label');
    const issues = [];
    
    textElements.forEach(el => {
      const computed = window.getComputedStyle(el);
      const fontSize = parseFloat(computed.fontSize);
      const hasText = el.textContent?.trim().length > 0;
      
      if (hasText && fontSize < minMobileFontSize) {
        issues.push({
          element: el,
          fontSize: fontSize + 'px',
          text: el.textContent.trim().substring(0, 50)
        });
      }
    });
    
    console.log(`📝 Typography Ellenőrzés: ${textElements.length} szöveges elem vizsgálva`);
    
    if (issues.length > 0) {
      console.warn(`⚠️ ${issues.length} elem szövege túl kicsi mobilon:`);
      issues.forEach((issue, i) => {
        console.log(`${i + 1}. ${issue.fontSize} - "${issue.text}"`);
        issue.element.style.background = 'rgba(255, 165, 0, 0.3)';
      });
    } else {
      console.log('✅ Minden szöveg megfelelő méretű mobilon');
    }
    
    return issues;
  },

  // 🔄 Layout shift detektálás
  detectLayoutShift() {
    let shiftScore = 0;
    
    if ('LayoutShiftObserver' in window) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          shiftScore += entry.value;
          console.log(`📐 Layout Shift észlelve: ${entry.value.toFixed(4)}`);
        }
      }).observe({type: 'layout-shift', buffered: true});
      
      setTimeout(() => {
        if (shiftScore === 0) {
          console.log('✅ Nincs layout shift probléma');
        } else if (shiftScore < 0.1) {
          console.log(`✅ Layout shift elfogadható: ${shiftScore.toFixed(4)}`);
        } else {
          console.warn(`⚠️ Layout shift túl magas: ${shiftScore.toFixed(4)} (max: 0.1)`);
        }
      }, 3000);
    } else {
      console.log('ℹ️ Layout Shift Observer nem támogatott');
    }
  },

  // 🧪 Responsive breakpoint teszt
  testBreakpoints() {
    const breakpoints = [
      { name: 'Mobile (iPhone SE)', width: 375 },
      { name: 'Mobile (iPhone 12)', width: 390 },
      { name: 'Small (sm)', width: 640 },
      { name: 'Medium (md)', width: 768 },
      { name: 'Large (lg)', width: 1024 },
      { name: 'Desktop', width: 1200 }
    ];
    
    console.log('🧪 Responsive Breakpoint Teszt:');
    
    breakpoints.forEach(bp => {
      // Tailwind CSS media query check
      const mediaQuery = `(min-width: ${bp.width}px)`;
      const matches = window.matchMedia(mediaQuery).matches;
      
      console.log(`${matches ? '✅' : '❌'} ${bp.name} (${bp.width}px): ${matches ? 'Aktív' : 'Inaktív'}`);
    });
  },

  // 📊 Performance mérés
  measurePerformance() {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      console.log('📊 Performance Métrések:');
      console.log(`⏱️ DOM Loading: ${Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart)}ms`);
      console.log(`🎨 First Paint: ${Math.round(paint[0]?.startTime || 0)}ms`);
      console.log(`🖼️ First Contentful Paint: ${Math.round(paint[1]?.startTime || 0)}ms`);
      
      // Layout információk
      const body = document.body.getBoundingClientRect();
      console.log(`📏 Oldal méret: ${Math.round(body.width)}x${Math.round(body.height)}px`);
      console.log(`📱 Viewport: ${window.innerWidth}x${window.innerHeight}px`);
    }
  },

  // 🚫 Horizontal scroll ellenőrzés
  checkHorizontalScroll() {
    const hasHorizontalScroll = document.body.scrollWidth > window.innerWidth;
    
    if (hasHorizontalScroll) {
      console.warn(`⚠️ Horizontális scroll található! Body szélesség: ${document.body.scrollWidth}px, Viewport: ${window.innerWidth}px`);
      
      // Túlfolyó elemek keresése
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          console.log(`📦 Túlfolyó elem:`, el);
          el.style.outline = '2px solid red';
        }
      });
    } else {
      console.log('✅ Nincs horizontális scroll probléma');
    }
    
    return hasHorizontalScroll;
  },

  // 🧭 Navigation teszt
  testMobileNavigation() {
    console.log('🧭 Mobil Navigation Teszt:');
    
    // Hamburger gomb keresése
    const hamburger = document.querySelector('[class*="md:hidden"]');
    const sidebar = document.querySelector('[class*="sidebar"], [class*="menu"]');
    
    if (hamburger) {
      console.log('✅ Hamburger menü gomb megtalálva');
      
      // Kattintás szimuláció
      hamburger.click();
      
      setTimeout(() => {
        const isVisible = sidebar && window.getComputedStyle(sidebar).display !== 'none';
        console.log(`${isVisible ? '✅' : '❌'} Sidebar ${isVisible ? 'megnyílt' : 'nem nyílt meg'} kattintásra`);
      }, 100);
      
    } else {
      console.warn('⚠️ Hamburger menü gomb nem található');
    }
  },

  // 🎯 Teljes mobil teszt futtatása
  runFullTest(viewportWidth = 375) {
    console.log('🚀 Teljes Mobil Teszt Indítása...');
    console.log('==========================================');
    
    // Viewport beállítás
    this.setViewport(viewportWidth, 667, 'iPhone SE');
    
    // Alapvető tesztek
    this.measurePerformance();
    this.testBreakpoints();
    this.checkHorizontalScroll();
    
    // UI tesztek
    this.checkTouchTargets();
    this.checkTypography();
    this.testMobileNavigation();
    
    // Layout tesztek
    this.detectLayoutShift();
    
    console.log('==========================================');
    console.log('🏁 Mobil Teszt Befejezve!');
    
    // Cleanup után
    setTimeout(() => {
      this.cleanup();
    }, 5000);
  },

  // 🧹 Cleanup (kiemelt elemek eltávolítása)
  cleanup() {
    console.log('🧹 Debug elemek eltávolítása...');
    
    document.querySelectorAll('*').forEach(el => {
      el.style.outline = '';
      el.style.background = el.style.background.replace('rgba(255, 165, 0, 0.3)', '');
      el.style.background = el.style.background.replace('rgba(255,0,0,0.1)', '');
    });
    
    document.body.style.width = '';
    document.body.style.margin = '';
    document.body.style.border = '';
    document.body.style.boxSizing = '';
    
    console.log('✅ Cleanup kész');
  }
};

// 🎮 Könnyen használható parancsok
console.log(`
🎮 MOBIL TESZT PARANCSOK:
=========================

🚀 Teljes teszt:
MobileTest.runFullTest();

📱 Eszköz specifikus tesztek:
MobileTest.runFullTest(375);  // iPhone SE
MobileTest.runFullTest(390);  // iPhone 12  
MobileTest.runFullTest(768);  // iPad

🔍 Egyedi tesztek:
MobileTest.checkTouchTargets();
MobileTest.checkTypography();
MobileTest.testMobileNavigation();
MobileTest.checkHorizontalScroll();

🧹 Cleanup:
MobileTest.cleanup();
`);

// Export for global use
window.MobileTest = MobileTest;