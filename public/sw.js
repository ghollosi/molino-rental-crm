// Service Worker for Molino Rental CRM - DISABLED
// Version: 1.0.0

// TEMPORARY: Disable all caching to fix deployment issues
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
self.addEventListener('fetch', (event) => {
  // Pass through all requests without caching
  return;
});