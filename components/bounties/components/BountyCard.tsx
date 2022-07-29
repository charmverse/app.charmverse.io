import { Box, Card, CardActionArea, CardHeader, Typography } from '@mui/material';
import { fancyTrim } from 'lib/utilities/strings';
import { Page } from '@prisma/client';
import { BountyWithDetails } from 'models';
import { memo } from 'react';
import BountyStatusBadge from './BountyStatusBadge';

interface Props {
  bounty: BountyWithDetails;
  page: Page;
  onClick?: () => void;
}

function BountyCard ({ bounty, page, onClick }: Props) {
  return (
    <Box
      onClick={onClick}
      className='KanbanCard'
      sx={{
        height: 150,
        display: 'grid' // make child full height,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}
      >
        <CardHeader title={page?.title} sx={{ p: 0 }} titleTypographyProps={{ sx: { fontSize: '1rem', fontWeight: 'bold' } }} />
        <Box width='100%' display='flex' flex={1} flexDirection='column' justifyContent='space-between'>
          <Typography paragraph={true}>
            {fancyTrim(page?.contentText, 50)}
          </Typography>
          <BountyStatusBadge bounty={bounty} hideStatus={true} />
        </Box>
      </Box>
    </Box>
  );
}

export default memo(BountyCard);
