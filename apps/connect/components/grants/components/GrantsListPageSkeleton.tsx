import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

export function GrantsListPageSkeleton() {
  return (
    <PageWrapper>
      <Card sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
        <Stack gap={1} justifyContent='center' direction='row'>
          <Skeleton animation='wave' width='100px' height={25} />
          <Skeleton animation='wave' width='100px' height={25} />
        </Stack>
        {[...new Array(3)].map((_, index) => (
          <Card
            key={`${index + 1}`}
            sx={{
              display: 'flex',
              gap: 2,
              p: 2
            }}
          >
            <Skeleton animation='wave' width='125px' height='125px' variant='rounded' />
            <Stack gap={1} width='calc(100% - 100px)'>
              <Skeleton animation='wave' width='100%' height={25} />
              <Skeleton animation='wave' width='100%' height={60} />
              <Skeleton animation='wave' width='50px' height={25} />
            </Stack>
          </Card>
        ))}
      </Card>
    </PageWrapper>
  );
}
