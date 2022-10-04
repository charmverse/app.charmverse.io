import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { Box, Card, Divider, MenuItem, Typography } from '@mui/material';

import type { BoardView } from 'components/common/BoardEditor/focalboard/src/blocks/boardView';
import Button from 'components/common/Button';

interface Props {
  title: string;
  views: BoardView[];
  onSelect: (viewId: string) => void;
  onClickBack: () => void;
}

export default function ViewSelection (props: Props) {
  return (
    <Box>
      <Box display='flex' alignItems='flex-end' justifyContent='space-between'>
        <Typography variant='h3'>Embed a database: {props.title}</Typography>
        <Button size='small' color='secondary' variant='outlined' onClick={props.onClickBack}>
          <ArrowBackIosIcon sx={{ fontSize: '14px' }} /> Go back
        </Button>
      </Box>
      <Card raised sx={{ my: 2 }}>
        <Box px={2} pt={1} pb={0}>
          <Typography fontWeight='bold'>Select a view:</Typography>
        </Box>
        <Divider light />
        {props.views.map(view => (
          <MenuItem
            onClick={() => props.onSelect(view.id)}
            key={view.id}
          >
            {view.title}
          </MenuItem>
        ))}
      </Card>
    </Box>
  );
}
