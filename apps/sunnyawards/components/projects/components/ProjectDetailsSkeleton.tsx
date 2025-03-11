import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { PageWrapper } from '@packages/connect-shared/components/common/PageWrapper';

export function ProjectDetailsSkeleton() {
  return (
    <PageWrapper bgcolor='transparent'>
      <Card sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
        <CardMedia
          component={Skeleton}
          sx={{ width: '100%', height: '150px' }}
          animation='wave'
          variant='rectangular'
        />
        <Box sx={{ position: 'relative', width: '100%', mt: '-75px', pl: 2 }}>
          <Skeleton variant='circular' width={100} height={100} animation='wave' />
        </Box>
        <CardContent sx={{ pt: 2 }}>
          <Stack gap={2}>
            <Stack direction='row' justifyContent='space-between'>
              <Skeleton animation='wave' height={30} width={250} />
              <Skeleton animation='wave' height={30} width={100} />
            </Stack>
            <Stack direction='row' gap={1}>
              <Skeleton variant='rectangular' width={24} height={24} animation='wave' />
              <Skeleton animation='wave' width={150} height={20} />
            </Stack>
            <Stack direction='row' gap={1}>
              <Skeleton variant='rectangular' width={24} height={24} animation='wave' />
              <Skeleton animation='wave' width={150} height={20} />
            </Stack>
            <Skeleton animation='wave' width='100%' height={150} />
            <Skeleton animation='wave' height={30} width={250} />
            <Stack gap={1}>
              <Skeleton animation='wave' width='100%' height={75} />
              <Skeleton animation='wave' width='100%' height={75} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
