import type { PageType } from '@charmverse/core/prisma';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton } from '@mui/material';
import type { MouseEvent } from 'react';
import { useState } from 'react';

import { PageActionsMenu } from './components/PageActionsMenu';

type Props = {
  page?: {
    createdBy: string;
    type?: PageType;
    id: string;
    updatedAt: Date;
    path: string;
    deletedAt: Date | null;
    parentId?: string | null;
    title: string | null;
  };
  readOnly?: boolean;
  onClickDelete?: VoidFunction;
  onClickEdit?: VoidFunction;
  hideDuplicateAction?: boolean;
};

export function KanbanPageActionsMenuButton({
  page,
  onClickDelete,
  hideDuplicateAction,
  onClickEdit,
  readOnly
}: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  return (
    <div data-test='page-actions-context-menu'>
      <IconButton size='small' className='icons' onClick={handleClick}>
        <MoreHorizIcon color='secondary' fontSize='small' />
      </IconButton>
      {page && (
        <PageActionsMenu
          anchorEl={anchorEl}
          setAnchorEl={setAnchorEl}
          page={page}
          onClickDelete={onClickDelete}
          hideDuplicateAction={hideDuplicateAction}
          onClickEdit={onClickEdit}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
