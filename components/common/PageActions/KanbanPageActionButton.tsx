import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton } from '@mui/material';
import type { MouseEvent } from 'react';
import { useState } from 'react';

import type { PageActionMeta } from './components/PageActionsMenu';
import { PageActionsMenu } from './components/PageActionsMenu';

type Props = {
  page?: PageActionMeta;
  readOnly?: boolean;
  onClickDelete?: VoidFunction;
  onClickEdit?: VoidFunction;
};

export function KanbanPageActionsMenuButton({ page, onClickDelete, onClickEdit, readOnly }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  return (
    <div data-testid='page-actions-context-menu'>
      <IconButton size='small' className='icons' onClick={handleClick}>
        <MoreHorizIcon color='secondary' fontSize='small' />
      </IconButton>
      {page && (
        <PageActionsMenu
          anchorEl={anchorEl}
          setAnchorEl={setAnchorEl}
          page={page}
          onClickDelete={onClickDelete}
          onClickEdit={onClickEdit}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
