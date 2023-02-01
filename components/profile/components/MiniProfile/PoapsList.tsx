import { Link, Typography } from '@mui/material';
import { Box, Stack } from '@mui/system';

import Avatar from 'components/common/Avatar';
import type { ExtendedPoap } from 'lib/blockchain/interfaces';

export function PoapsList({ poaps }: { poaps: ExtendedPoap[] }) {
  const sortedPoapData = poaps.sort((p1, p2) => (p1.created > p2.created ? -1 : 1));

  return (
    <Stack gap={1}>
      <Typography variant='h6'>Recent POAPs</Typography>
      <Stack gap={1} display='flex' flexDirection='row'>
        {sortedPoapData.slice(0, 5).map((poap) => (
          <Box key={poap.id}>
            <Link href={`https://app.poap.xyz/token/${poap.tokenId}`} target='_blank' display='flex'>
              <Avatar size='large' avatar={poap.imageURL} />
            </Link>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
