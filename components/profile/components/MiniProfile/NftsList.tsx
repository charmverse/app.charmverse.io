import { Link, Typography } from '@mui/material';
import { Box, Stack } from '@mui/system';

import Avatar from 'components/common/Avatar';
import type { NftData } from 'lib/blockchain/interfaces';
import { transformNft } from 'lib/blockchain/transformNft';

export function NftsList({ nfts }: { nfts: NftData[] }) {
  const pinnedNfts = nfts.filter((nft) => nft.isPinned);

  return (
    <Stack gap={1}>
      <Typography variant='h6'>NFTs</Typography>
      <Stack gap={1} display='flex' flexDirection='row'>
        {pinnedNfts.map((nft) => {
          const nftData = transformNft(nft);
          return (
            <Box key={nft.id}>
              <Link href={nftData.link} target='_blank' display='flex'>
                <Avatar size='large' avatar={nftData.image} />
              </Link>
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}
