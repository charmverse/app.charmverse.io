import type { Space } from '@charmverse/core/prisma';
import { Badge } from '@mui/material';
import type { MenuItemProps } from '@mui/material/MenuItem';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';

import { DraggableListItem } from 'components/common/DraggableListItem';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { Notification } from '@packages/lib/notifications/interfaces';
import { getSpaceUrl } from '@packages/lib/utils/browser';

import WorkspaceAvatar from './WorkspaceAvatar';

interface SpaceListItemProps extends MenuItemProps {
  space: Space;
  notifications: Notification[];
  changeOrderHandler: (draggedProperty: string, droppedOnProperty: string) => Promise<void>;
}

export default function SpaceListItem({
  notifications,
  space,
  changeOrderHandler,
  selected,
  disabled
}: SpaceListItemProps) {
  const { space: currentSpace } = useCurrentSpace();
  // Don't show notifications badge for the current space (notion ux)
  const spaceNotifications =
    currentSpace?.id === space.id
      ? []
      : notifications.filter((notification) => notification.spaceId === space.id && !notification.read);
  return (
    <DraggableListItem name='spaceItem' itemId={space.id} changeOrderHandler={changeOrderHandler} key={space.domain}>
      <MenuItem
        component={NextLink}
        href={getSpaceUrl({ domain: space.domain, customDomain: space.customDomain })}
        selected={selected}
        disabled={disabled}
      >
        <Badge badgeContent={spaceNotifications.length} color='error'>
          <WorkspaceAvatar name={space.name} image={space.spaceImage} />
        </Badge>
        <Typography noWrap ml={1}>
          {space.name}
        </Typography>
      </MenuItem>
    </DraggableListItem>
  );
}
