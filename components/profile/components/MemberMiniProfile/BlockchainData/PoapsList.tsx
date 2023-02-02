import { Link, Tooltip, Typography } from '@mui/material';
import { Stack } from '@mui/system';

import Avatar from 'components/common/Avatar';
import type { ExtendedPoap } from 'lib/blockchain/interfaces';
import { transformPoap } from 'lib/blockchain/transformPoap';

export function PoapsList({ poaps }: { poaps: ExtendedPoap[] }) {
  const sortedPoapData = poaps.sort((p1, p2) => (p1.created > p2.created ? -1 : 1));

  return (
    <Stack gap={1}>
      <Typography variant='h6'>Recent POAPs</Typography>
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
    </Stack>
  );
}
