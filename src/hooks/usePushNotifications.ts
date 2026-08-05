'use client';

import { useEffect, useState } from 'react';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
      
      if (!sub && Notification.permission === 'default') {
        // Automatically ask for permission if not already granted/denied
        subscribeToPush(registration);
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const subscribeToPush = async (registration?: ServiceWorkerRegistration) => {
    try {
      const reg = registration || await navigator.serviceWorker.ready;
      
      // In a real implementation, you would fetch the VAPID public key from your server
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuB-5tO7tZ1Kk4y-5v0p5P5_5w';
      
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
      
      setSubscription(sub);
      
      // Here you would send the subscription to your server to save in the DB
      // await fetch('/api/webhooks/push', { method: 'POST', body: JSON.stringify(sub) });
      
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  };

  return { isSupported, subscription, subscribeToPush };
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
