import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import { Link, Typography } from '@mui/material';
import { Box, Stack } from '@mui/system';

import Avatar from 'components/common/Avatar';
import { useUser } from 'hooks/useUser';
import type { NftData } from 'lib/blockchain/interfaces';
import { transformNft } from 'lib/blockchain/transformNft';

const totalShownNfts = 5;

const NonPinnedBox = styled(Box)`
  width: 54px;
  height: 54px;
  display: flex;
  justify-content: center;
  align-items: center;
  ${({ theme }) => `border: 2px solid ${theme.palette.secondary.main}`};
  cursor: pointer;
`;

function NonPinnedNftBox() {
  return (
    <NonPinnedBox>
      <AddIcon color='secondary' />
    </NonPinnedBox>
  );
}

export function NftsList({ memberId, nfts }: { memberId: string; nfts: NftData[] }) {
  const { user: currentUser } = useUser();
  const pinnedNfts = nfts.filter((nft) => nft.isPinned);
  const emptyNftsCount = totalShownNfts - pinnedNfts.length;
  return (
    <Stack gap={1}>
      <Typography variant='h6'>NFTs</Typography>
      <Stack gap={2} display='flex' flexDirection='row'>
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
        {currentUser?.id === memberId ? (
          new Array(emptyNftsCount).fill(0).map((_, i) => <NonPinnedNftBox key={`${i.toString()}`} />)
        ) : pinnedNfts.length === 0 ? (
          <Typography color='secondary'>No pinned NFTs</Typography>
        ) : null}
      </Stack>
    </Stack>
  );
}
