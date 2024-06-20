import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Skeleton from '@mui/material/Skeleton';

export function ProjectItemSkeleton() {
  return (
    <Card sx={{ display: 'flex', gap: 2, p: 2, alignItems: 'flex-start', justifyContent: 'flex-start' }}>
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
        alignItems='flex-start'
        gap={1}
        sx={{ p: 0, justifyContent: 'space-between' }}
      >
        <Box width='100%'>
          <Skeleton animation='wave' width='180px' height={25} />
          <Skeleton animation='wave' width='180px' />
        </Box>
        <Box display='flex' gap={1}>
          <Skeleton variant='circular' width={40} height={40} />
          <Skeleton variant='circular' width={40} height={40} />
          <Skeleton variant='circular' width={40} height={40} />
        </Box>
      </CardContent>
    </Card>
  );
}
