import { MoreHoriz as MoreHorizIcon } from '@mui/icons-material';
import type { TypographyProps } from '@mui/material';
import { Menu, ListItem, Divider, Typography, MenuItem, IconButton } from '@mui/material';
import { useState } from 'react';

import type { Repo } from 'lib/repos/getRepos';

import { DeleteRepoMenuItem } from './DeleteRepoMenuItem';

export function RepoActionButton({ repo, onChange }: { repo: Repo; onChange: () => void }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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
      <IconButton size='small' onClick={handleClick}>
        <MoreHorizIcon />
      </IconButton>
      <Menu id='user-menu' anchorEl={anchorEl} open={open} onClose={handleClose} onClick={handleClose}>
        <DeleteRepoMenuItem repoId={repo.id} deletedAt={repo.deletedAt} onDelete={onChange} />
      </Menu>
    </>
  );
}
