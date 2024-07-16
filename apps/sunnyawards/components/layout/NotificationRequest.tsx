'use client';

import { useEffect, useState } from 'react';

import { actionSaveSubscription } from 'lib/actions/saveSubscription';

export function NotificationRequest({ vapidPublicKey }: { vapidPublicKey?: string }) {
  const [permission, setPermission] = useState(
    typeof window !== 'undefined' ? window?.Notification?.permission : false
  );

  useEffect(() => {
    const requestPermission = async () => {
      const notificationPermission = await Notification.requestPermission();

      setPermission(notificationPermission);

      if (notificationPermission === 'granted') {
        const notificationsSupported =
          'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

        if (!notificationsSupported || Notification.permission !== 'granted') {
          return;
        }

        const swRegistration = await navigator.serviceWorker.getRegistration();

        const options: PushSubscriptionOptionsInit = {
          applicationServerKey: vapidPublicKey,
          userVisibleOnly: true
        };

        if (!swRegistration || !vapidPublicKey) {
          return;
        }

        const subscription = await swRegistration.pushManager.subscribe(options);

        if (!subscription) {
          return;
        }

        const json = JSON.parse(JSON.stringify(subscription));

        await actionSaveSubscription({ subscription: json });
      }
    };

    if (permission === 'default') {
      requestPermission();
    }
  }, [permission, vapidPublicKey]);

  return null;
}
