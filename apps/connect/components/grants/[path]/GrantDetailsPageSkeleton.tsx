import 'server-only';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

import { PageWrapper } from 'components/common/PageWrapper';

export function GrantDetailsPageSkeleton() {
  return (
    <PageWrapper>
      <Card sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
        <CardMedia
          component={Skeleton}
          sx={{ width: '100%', height: '150px' }}
          animation='wave'
          variant='rectangular'
        />
        <Box sx={{ position: 'relative', width: '100%', mt: '-75px', pl: 2 }}>
          <Skeleton variant='rounded' width={100} height={100} animation='wave' />
        </Box>
        <CardContent sx={{ pt: 2 }}>
          <Stack gap={2}>
            <Skeleton animation='wave' height={30} width={250} />
            <Skeleton animation='wave' width={75} height={20} />
            <Skeleton animation='wave' width='100%' height={250} />
            <Stack gap={1} justifyContent='center' direction='row'>
              <Skeleton animation='wave' width='100px' height={50} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
