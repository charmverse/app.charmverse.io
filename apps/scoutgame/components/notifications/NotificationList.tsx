import type { ScoutGameActivity } from '@charmverse/core/prisma-client';
import { List } from '@mui/material';
import React from 'react';

import { NotificationRow } from './NotificationRow';

export function NotificationList({ notifications }: { notifications: ScoutGameActivity[] }) {
  return (
    <List>
      {notifications.map((row) => (
        <NotificationRow key={row.id} activity={row} />
      ))}
    </List>
  );
}
