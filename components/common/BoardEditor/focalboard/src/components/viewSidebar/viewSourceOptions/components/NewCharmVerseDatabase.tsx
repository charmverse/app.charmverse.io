import AddIcon from '@mui/icons-material/Add';
import { ListItemIcon, MenuItem, Typography } from '@mui/material';

import type { DataSourceType } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';

export type NewDatabaseSourceProps = {
  onCreateDatabase: (input: { sourceType: DataSourceType }) => Promise<BoardView>;
};

export function NewCharmVerseDatabase({ onCreateDatabase }: NewDatabaseSourceProps) {
  return (
    <MenuItem onClick={() => onCreateDatabase({ sourceType: 'board_page' })}>
      <ListItemIcon>
        <AddIcon color='secondary' />
      </ListItemIcon>
      <Typography variant='body2' color='secondary'>
        New database
      </Typography>
    </MenuItem>
  );
}
