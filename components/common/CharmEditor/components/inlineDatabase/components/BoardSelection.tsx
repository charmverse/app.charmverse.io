import { Box, Card, Divider, Typography } from '@mui/material';
import { Page } from '@prisma/client';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import Button from 'components/common/Button';
import PagesList from '../../PageList';

interface Props {
  pages: Page[];
  onSelect: (boardId: string) => void;
  onClickBack: () => void;
}

export default function BoardSelection (props: Props) {
  return (
    <Box>
      <Box display='flex' alignItems='flex-end' justifyContent='space-between'>
        <Typography variant='h3'>Embed a database</Typography>
        <Button size='small' color='secondary' variant='outlined' onClick={props.onClickBack}>
          <ArrowBackIosIcon sx={{ fontSize: '14px' }} /> Go back
        </Button>
      </Box>
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
