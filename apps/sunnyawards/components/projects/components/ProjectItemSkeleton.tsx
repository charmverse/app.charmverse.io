import { Stack } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Skeleton from '@mui/material/Skeleton';

export function ProjectItemSkeleton() {
  return (
    <Card sx={{ display: 'flex', gap: 2, p: 2, alignItems: 'center', justifyContent: 'flex-start' }}>
      <CardMedia
        component={Skeleton}
        sx={{ width: '100px', height: '100px', borderRadius: 3 }}
        animation='wave'
        variant='rectangular'
      />
      <CardContent
        component={Box}
        display='flex'
        justifyContent='space-between'
        flexDirection='column'
        gap={1}
        sx={{ p: 0, justifyContent: 'space-between' }}
      >
        <Skeleton animation='wave' height={25} width={200} />
        <Skeleton variant='rectangular' width={250} height={50} animation='wave' />
        <Stack direction='row' gap={1}>
          <Skeleton variant='circular' width={25} height={25} animation='wave' />
          <Skeleton variant='circular' width={25} height={25} animation='wave' />
          <Skeleton variant='circular' width={25} height={25} animation='wave' />
        </Stack>
      </CardContent>
    </Card>
  );
}
