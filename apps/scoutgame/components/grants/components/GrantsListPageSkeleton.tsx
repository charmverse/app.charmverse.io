import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

import { SinglePageWrapper } from 'components/common/SinglePageWrapper';

export function GrantsListPageSkeleton() {
  return (
    <SinglePageWrapper>
      <Stack gap={1} justifyContent='center' direction='row'>
        <Skeleton animation='wave' width='100px' height={25} />
        <Skeleton animation='wave' width='100px' height={25} />
      </Stack>
      <Stack gap={1} my={1}>
        {[...new Array(3)].map((_, index) => (
          <Card
            key={`${index + 1}`}
            sx={{
              display: 'flex',
              gap: 2,
              p: 2,
              flexDirection: 'column'
            }}
          >
            <Stack direction='row' gap={2}>
              <Skeleton animation='wave' width='50px' height='50px' variant='rounded' />
              <Stack gap={1}>
                <Skeleton animation='wave' width='100px' height={25} />
                <Skeleton animation='wave' width='25px' height={20} />
              </Stack>
            </Stack>
            <Skeleton animation='wave' width='100%' height={20} />
            <Skeleton animation='wave' width='75%' height={20} />
            <Skeleton animation='wave' width='150px' height={20} sx={{ my: 1 }} />
            <Skeleton animation='wave' width='100%' height={150} />
          </Card>
        ))}
      </Stack>
    </SinglePageWrapper>
  );
}
