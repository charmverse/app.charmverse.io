import type { Space } from '@charmverse/core/prisma';
import type { MenuItemProps } from '@mui/material/MenuItem';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';

import { getSpaceUrl } from 'lib/utilities/browser';

import DraggableListItem from '../../DraggableListItem';

import WorkspaceAvatar from './WorkspaceAvatar';

interface SpaceListItemProps extends MenuItemProps {
  space: Space;
  changeOrderHandler: (draggedProperty: string, droppedOnProperty: string) => Promise<void>;
}

export default function SpaceListItem({ space, changeOrderHandler, selected, disabled }: SpaceListItemProps) {
  return (
    <DraggableListItem name='spaceItem' itemId={space.id} changeOrderHandler={changeOrderHandler} key={space.domain}>
      <MenuItem
        component={NextLink}
        href={getSpaceUrl({ domain: space.domain, customDomain: space.customDomain })}
        selected={selected}
        disabled={disabled}
      >
        <WorkspaceAvatar name={space.name} image={space.spaceImage} />
        <Typography noWrap ml={1}>
          {space.name}
        </Typography>
      </MenuItem>
    </DraggableListItem>
  );
}
