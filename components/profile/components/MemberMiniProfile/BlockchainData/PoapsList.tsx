import { Alert, Grid, Link, Tooltip, Typography, Stack } from '@mui/material';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import LoadingComponent from 'components/common/LoadingComponent';
import { useUser } from 'hooks/useUser';
import { transformPoap } from 'lib/blockchain/transformPoap';

export function PoapsList({ memberId }: { memberId: string }) {
  const {
    data: poaps = [],
    isLoading: isFetchingPoaps,
    error
  } = useSWRImmutable(`/poaps/${memberId}`, () => {
    return charmClient.getUserPoaps(memberId);
  });
  const { user: currentUser } = useUser();

  const sortedPoapData = poaps.sort((p1, p2) => (p1.created > p2.created ? -1 : 1));

  if (currentUser?.id !== memberId && poaps.length === 0) {
    return null;
  }

  return (
    <Stack gap={1}>
      <Typography variant='h6'>Recent POAPs</Typography>
      {error && (
        <Grid item>
          <Alert severity='error'>Failed to fetch your poaps</Alert>
        </Grid>
      )}
      {!error &&
        (isFetchingPoaps ? (
          <LoadingComponent isLoading />
        ) : (
          <Stack gap={2} display='flex' flexDirection='row'>
            {sortedPoapData.length !== 0 ? (
              sortedPoapData.slice(0, 5).map((poap) => {
                const poapData = transformPoap(poap);

                return (
                  <Tooltip title={poapData.title} key={poapData.id}>
                    <Link href={poapData.link} target='_blank' display='flex'>
                      <Avatar size='large' avatar={poapData.image} />
                    </Link>
                  </Tooltip>
                );
              })
            ) : (
              <Typography color='secondary'>No POAPs</Typography>
            )}
          </Stack>
        ))}
    </Stack>
  );
}
