import { MoreHoriz as MoreHorizIcon } from '@mui/icons-material';
import type { TypographyProps } from '@mui/material';
import { Menu, ListItem, Divider, Typography, MenuItem, IconButton } from '@mui/material';
import { useState } from 'react';

import type { ScoutGameUser } from 'lib/users/getUsers';

import { AddBuilderModal } from './AddBuilderModal';
import { ViewTransactionsModal } from './ViewTransactionsModal';

export function UserActionButton({ user }: { user: ScoutGameUser }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        size='small'
        onClick={handleClick}
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup='true'
        aria-expanded={open ? 'true' : undefined}
      >
        <MoreHorizIcon />
      </IconButton>
      <Menu id='user-menu' anchorEl={anchorEl} open={open} onClose={handleClose} onClick={handleClose}>
        {(user.builderStatus === 'applied' || user.builderStatus === 'rejected') && (
          <MenuItem onClick={() => setIsBuilderModalOpen(true)}>Review builder profile</MenuItem>
        )}
        {!user.builderStatus && (
          <MenuItem onClick={() => setIsBuilderModalOpen(true)}>Register builder profile</MenuItem>
        )}
        <MenuItem onClick={() => setIsTransactionsModalOpen(true)}>View NFT transactions</MenuItem>
        <Divider />
        <MenuItemNoAction>
          Scout Id: <strong>{user.id}</strong>
        </MenuItemNoAction>
        <MenuItemNoAction>
          Fid: <strong>{user.farcasterId || '--'}</strong>
        </MenuItemNoAction>
        <MenuItemNoAction>
          Github: <strong>{user.githubLogin || '--'}</strong>
        </MenuItemNoAction>
        <MenuItemNoAction>
          Wallets: <strong>{user.wallets.join(', ')}</strong>
        </MenuItemNoAction>
      </Menu>
      <AddBuilderModal
        user={user}
        open={isBuilderModalOpen}
        onClose={() => setIsBuilderModalOpen(false)}
        onAdd={() => {}}
      />
      <ViewTransactionsModal
        open={isTransactionsModalOpen}
        onClose={() => setIsTransactionsModalOpen(false)}
        scoutId={user.id}
      />
    </>
  );
}

function MenuItemNoAction({ children, ...props }: { children: React.ReactNode } & TypographyProps) {
  return (
    <ListItem dense onClick={(e) => e.stopPropagation()}>
      <Typography color='text.secondary' variant='caption' {...props}>
        {children}
      </Typography>
    </ListItem>
  );
}
