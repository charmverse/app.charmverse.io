import { Box } from '@mui/material';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { PageWrapper } from '@packages/connect-shared/components/common/PageWrapper';

import { ProjectItemSkeleton } from './ProjectItemSkeleton';

export function ProfileDetailsSkeleton() {
  return (
    <PageWrapper bgcolor='transparent'>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Card sx={{ p: 2 }}>
          <Stack flexDirection='row' gap={3} alignItems='center'>
            <Skeleton variant='circular' width={100} height={100} animation='wave' />
            <Stack gap={1}>
              <Skeleton animation='wave' height={25} width={200} />
              <Skeleton animation='wave' height={20} width={100} />
              <Skeleton variant='rectangular' width={250} height={50} animation='wave' />
            </Stack>
          </Stack>
        </Card>
        <Skeleton variant='rectangular' width={250} height={25} animation='wave' />
        <ProjectItemSkeleton />
        <ProjectItemSkeleton />
        <ProjectItemSkeleton />
      </Box>
    </PageWrapper>
  );
}
