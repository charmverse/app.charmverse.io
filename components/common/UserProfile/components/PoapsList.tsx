import { Alert, Grid, Link, Stack, Tooltip, Typography } from '@mui/material';

import Avatar from 'components/common/Avatar';
import LoadingComponent from 'components/common/LoadingComponent';
import type { ExtendedPoap } from 'lib/blockchain/interfaces';
import { transformPoap } from 'lib/blockchain/transformPoap';

export function PoapsList({
  poapsError,
  isFetchingPoaps,
  poaps
}: {
  poapsError: any;
  isFetchingPoaps: boolean;
  poaps: ExtendedPoap[];
}) {
  const sortedPoapData = poaps.sort((p1, p2) => (p1.created > p2.created ? -1 : 1));

  return (
    <Stack gap={1} data-test='member-profile-poap-list'>
      <Typography variant='h6'>Recent POAPs</Typography>
      {poapsError && (
        <Grid item>
          <Alert severity='error'>Failed to fetch your poaps</Alert>
        </Grid>
      )}
      {!poapsError &&
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
