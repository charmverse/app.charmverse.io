import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

import 'server-only';

export function FeedListSkeleton() {
  return (
    <Stack sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[...new Array(3)].map((_, index) => (
        <Card key={`${index + 1}`}>
          <Stack
            sx={{
              gap: 2,
              p: 2
            }}
          >
            <Stack direction='row' gap={1} alignItems='center'>
              <Skeleton variant='circular' width={30} height={30} />
              <Skeleton animation='wave' width={150} height={25} />
              <Skeleton animation='wave' width={100} height={25} />
              <Skeleton animation='wave' width={50} height={25} />
            </Stack>

            <Skeleton animation='wave' width='100%' height='125px' variant='rounded' />
            <Stack gap={1} width='100%' direction='row'>
              <Skeleton variant='circular' width={20} height={20} />
              <Skeleton variant='circular' width={20} height={20} />
              <Skeleton variant='circular' width={20} height={20} />
            </Stack>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
