import styled from '@emotion/styled';
import { Box, CircularProgress, Grid } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

import EmptyAvatarGallery from 'components/profile/components/NftAvatarGallery/RenderEmptyAvatarGallery';
import { useUser } from 'hooks/useUser';
import type { NftData } from 'lib/blockchain/interfaces';

import NftGalleryItem from './NftGalleryItem';

const ProgressContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

type Props = {
  onSelect?: (avatar: NftData) => void;
  isSaving?: boolean;
  nfts: NftData[] | undefined;
  isLoading?: boolean;
  emptyMessage?: string;
};

export default function NftAvatarGallery ({ onSelect, isSaving, nfts, isLoading, emptyMessage }: Props) {
  const { user } = useUser();

  const getIsSelected = (nft: NftData) => {
    if (!user) {
      return false;
    }

    return user.avatarContract?.toLowerCase() === nft.contract.toLowerCase()
    && user.avatarTokenId?.toLowerCase() === nft.tokenId.toLowerCase()
    && user.avatarChain === nft.chainId;
  };

  return (
    <Box position='relative'>
      <Grid container spacing={1}>
        {isLoading ? [0, 1, 2].map(id => (
          <Grid key={id} item xs={6} sm={3} sx={{ minWidth: 110 }}>
            <Stack spacing={1}>
              <Skeleton variant='rectangular' width={100} height={80} />
              <Skeleton variant='text' sx={{ fontSize: '1rem' }} />
            </Stack>
          </Grid>
        ))
          : nfts?.length ? nfts.map(nft => (
            <Grid key={`${nft.contract}-${nft.tokenId}`} item xs={6} sm={3} sx={{ minWidth: 110 }}>
              <NftGalleryItem nft={nft} onClick={() => onSelect?.(nft)} isSelected={getIsSelected(nft)} />
            </Grid>
          )) : (
            <EmptyAvatarGallery emptyMessage={emptyMessage} />
          )}
      </Grid>

      {isSaving && (
        <ProgressContainer>
          <CircularProgress />
        </ProgressContainer>
      )}
    </Box>
  );
}
