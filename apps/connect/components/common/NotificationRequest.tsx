'use client';

import { Alert, Box, Button, Snackbar, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { savePushNotificationSubscriptionAction } from 'lib/pwa/savePushNotificationSubscriptionAction';

export function NotificationRequest({ vapidPublicKey }: { vapidPublicKey?: string }) {
  const [permission, setPermission] = useLocalStorage<NotificationPermission>(
    'notificationPermission',
    typeof window !== 'undefined' ? window?.Notification?.permission : 'default'
  );

  const [snackbarState, setSnackbarState] = useState<boolean>(false);

  const handleDeny = () => {
    setPermission('denied');
    setSnackbarState(false);
  };

  const handleClose = () => {
    setSnackbarState(false);
  };

  const requestPermission = useCallback(async () => {
    const notificationsSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    const notificationPermission = await Notification.requestPermission();
    setPermission(notificationPermission);

    if (notificationPermission === 'granted') {
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

      await savePushNotificationSubscriptionAction({ subscription: json });
    }
  }, [vapidPublicKey, setPermission]);

  // Update permission state if the user changes it manually
  useEffect(() => {
    if (permission !== 'denied' && permission !== Notification.permission) {
      setPermission(Notification.permission);
    }
  }, [permission, setPermission]);

  // Alert the user to allow notifications
  useEffect(() => {
    if (permission === 'default') {
      setSnackbarState(true);
    } else {
      setSnackbarState(false);
    }
  }, [permission, requestPermission]);

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={snackbarState}
      onClose={handleClose}
      key='notification'
    >
      <Alert severity='info' icon={<div />}>
        <Box display='flex' flexDirection='column' gap={1}>
          <Typography variant='body2'>Get notified of Grants and Funding Opportunities</Typography>
          <Box display='flex' gap={1}>
            <Button onClick={requestPermission}>Allow</Button>
            <Button onClick={handleDeny} variant='outlined'>
              Deny
            </Button>
          </Box>
        </Box>
      </Alert>
    </Snackbar>
  );
}
