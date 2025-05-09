import AddIcon from '@mui/icons-material/Add';
import { ListItemIcon, MenuItem, Typography } from '@mui/material';

import type { BoardView } from '@packages/databases/boardView';

export type NewDatabaseSourceProps = {
  onCreateDatabase: () => Promise<BoardView>;
};

export function NewCharmVerseDatabase({ onCreateDatabase }: NewDatabaseSourceProps) {
  return (
    <MenuItem onClick={() => onCreateDatabase()}>
      <ListItemIcon>
        <AddIcon color='secondary' />
      </ListItemIcon>
      <Typography variant='body2' color='secondary'>
        New database
      </Typography>
    </MenuItem>
  );
}
