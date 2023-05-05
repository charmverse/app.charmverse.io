import type { PageType } from '@charmverse/core/prisma';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton } from '@mui/material';
import type { MouseEvent } from 'react';
import { useState } from 'react';

import type { DuplicatePageResponse } from 'lib/pages/duplicatePage';

import { PageActionsMenu } from './components/PageActionsMenu';

export function KanbanPageActions({
  page,
  onClickDelete,
  hideDuplicateAction,
  onClickEdit,
  readOnly,
  onDuplicate
}: {
  onDuplicate?: (duplicatePageResponse: DuplicatePageResponse) => void;
  page: {
    createdBy: string;
    type?: PageType;
    id: string;
    updatedAt: Date;
    relativePath?: string;
    path: string;
    deletedAt: Date | null;
    parentId?: string | null;
    title: string | null;
  };
  readOnly?: boolean;
  onClickDelete?: VoidFunction;
  onClickEdit?: VoidFunction;
  hideDuplicateAction?: boolean;
}) {
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
      <PageActionsMenu
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
        page={page}
        onClickDelete={onClickDelete}
        hideDuplicateAction={hideDuplicateAction}
        onClickEdit={onClickEdit}
        readOnly={readOnly}
        onDuplicate={onDuplicate}
      />
    </div>
  );
}
