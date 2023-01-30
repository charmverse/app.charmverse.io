import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton } from '@mui/material';
import type { PageType } from '@prisma/client';
import type { MouseEvent, ReactNode } from 'react';
import { useState } from 'react';

import { PageActionsMenu } from './PageActionsMenu';

export function PageActions({
  page,
  onClickDelete,
  onClickEdit,
  onClickDuplicate,
  children
}: {
  page: { createdBy: string; type?: PageType; id: string; updatedAt: Date; relativePath?: string; path: string };
  onClickDelete?: VoidFunction;
  onClickEdit?: VoidFunction;
  onClickDuplicate?: VoidFunction;
  children?: ReactNode;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  return (
    <>
      <IconButton size='small' className='icons' onClick={handleClick}>
        <MoreHorizIcon color='secondary' fontSize='small' />
      </IconButton>
      <PageActionsMenu
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
        page={page}
        onClickDelete={onClickDelete}
        onClickDuplicate={onClickDuplicate}
        onClickEdit={onClickEdit}
      >
        {children}
      </PageActionsMenu>
    </>
  );
}
