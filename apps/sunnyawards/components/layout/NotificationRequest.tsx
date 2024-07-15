'use client';

import env from '@beam-australia/react-env';
import { useEffect, useState } from 'react';

import { actionSaveSubscription } from 'lib/actions/saveSubscription';

import { VAPID_PUBLIC_KEY } from './constants';

export function NotificationRequest() {
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
          applicationServerKey: VAPID_PUBLIC_KEY,
          userVisibleOnly: true
        };

        if (!swRegistration) {
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
  }, [permission]);

  return null;
}
