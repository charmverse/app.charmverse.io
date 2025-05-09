import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { IconButton } from '@mui/material';
import type { MouseEvent } from 'react';
import { useState } from 'react';

import type { PageActionMeta } from './components/DatabaseRowActionsMenu';
import { DatabaseRowActionsMenu } from './components/DatabaseRowActionsMenu';

type Props = {
  page?: PageActionMeta;
  readOnly?: boolean;
  onClickDelete?: VoidFunction;
  onClickEdit?: VoidFunction;
  isApplication?: boolean;
};

export function KanbanPageActionsMenuButton({ isApplication, page, onClickDelete, onClickEdit, readOnly }: Props) {
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
        <DatabaseRowActionsMenu
          anchorEl={anchorEl}
          setAnchorEl={setAnchorEl}
          page={page}
          isApplication={isApplication}
          onClickDelete={onClickDelete}
          onClickEdit={onClickEdit}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
