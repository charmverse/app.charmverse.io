import React from 'react';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { CircularProgress, Typography, Grid, Box } from '@mui/material';

import { NftData } from 'lib/nft/types';
import { useUser } from 'hooks/useUser';
import styled from '@emotion/styled';
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
  onSelect?: (avatar: NftData) => void
  isSaving?: boolean;
  nfts: NftData[] | undefined;
  isLoading?: boolean;
  emptyMessage?: string
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

  function renderEmpty () {
    return emptyMessage ? (
      <Box p={4} textAlign='center' flex={1}>
        <Typography>{emptyMessage}</Typography>
      </Box>
    ) : null;
  }

  return (
    <Box position='relative'>
      {isLoading ? (
        <Grid container spacing={1}>
          {[0, 1, 2].map(id => (
            <Grid key={id} item xs={6} sm={3} sx={{ minWidth: 110 }}>
              <Stack spacing={1}>
                <Skeleton variant='rectangular' width={100} height={80} />
                <Skeleton variant='text' sx={{ fontSize: '1rem' }} />
              </Stack>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={1}>
          {nfts?.length ? nfts?.map(nft => (
            <Grid key={`${nft.contract}-${nft.tokenId}`} item xs={6} sm={3} sx={{ minWidth: 110 }}>
              <NftGalleryItem nft={nft} onClick={() => onSelect?.(nft)} isSelected={getIsSelected(nft)} />
            </Grid>
          )) : (
            renderEmpty()
          )}
        </Grid>
      )}

      {isSaving && (
        <ProgressContainer>
          <CircularProgress />
        </ProgressContainer>
      )}
    </Box>
  );
}
