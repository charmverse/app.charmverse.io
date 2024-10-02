import { List } from '@mui/material';
import type { ScoutGameNotification } from '@packages/scoutgame/notifications/getNotifications';
import React from 'react';

import { PageContainer } from '../layout/PageContainer';

import { NotificationRow } from './components/NotificationRow';

export function NotificationsPage({ notifications }: { notifications: ScoutGameNotification[] }) {
  return (
    <PageContainer>
      <List>
        {notifications.map((row) => (
          <NotificationRow key={row.id} notification={row} />
        ))}
      </List>
    </PageContainer>
  );
}
