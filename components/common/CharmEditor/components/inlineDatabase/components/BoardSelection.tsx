import { Box, Card, Divider, Typography } from '@mui/material';
import { Page } from '@prisma/client';
import PagesList from '../../PageList';

interface Props {
  pages: Page[];
  onSelect: (boardId: string) => void;
}

export default function BoardSelection (props: Props) {
  return (
    <Box>
      <Typography variant='h3'>Embed a database</Typography>
      <Card raised sx={{ my: 2 }}>
        <Box px={2} pt={1} pb={0}>
          <Typography fontWeight='bold'>Select a data source:</Typography>
        </Box>
        <Divider light />
        <PagesList pages={props.pages} onSelectPage={page => props.onSelect(page.id)} />
      </Card>
    </Box>
  );
}
