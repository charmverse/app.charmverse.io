import type { ScoutGameActivity } from '@charmverse/core/prisma-client';
import { List } from '@mui/material';
import React from 'react';

import { PageContainer } from '../layout/PageContainer';

import { NotificationRow } from './components/NotificationRow';

export function NotificationsPage({ notifications }: { notifications: ScoutGameActivity[] }) {
  return (
    <PageContainer>
      <List>
        {notifications.map((row) => (
          <NotificationRow key={row.id} activity={row} />
        ))}
      </List>
    </PageContainer>
  );
}
