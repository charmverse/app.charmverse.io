import { MoreHoriz as MoreHorizIcon } from '@mui/icons-material';
import { Menu, MenuItem, IconButton } from '@mui/material';
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
      <Menu
        id='user-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
      >
        {(user.builderStatus === 'applied' || user.builderStatus === 'rejected') && (
          <MenuItem onClick={() => setIsBuilderModalOpen(true)}>Approve builder profile</MenuItem>
        )}
        {!user.builderStatus && <MenuItem onClick={() => setIsBuilderModalOpen(true)}>Add builder profile</MenuItem>}
        <MenuItem onClick={() => setIsTransactionsModalOpen(true)}>View NFT transactions</MenuItem>
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
