import React from 'react';
import { useMyNfts } from 'hooks/useMyNfts';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { Dialog, DialogTitle, CircularProgress, DialogContent, Typography, Grid, Box } from '@mui/material';

import { NftGalleryItem } from 'components/profile/components/NftAvatarGallery/NftGalleryItem';
import { NftData } from 'lib/nft/types';
import { useUser } from 'hooks/useUser';

type Props = {
  onSelect?: (avatar: NftData) => void
  isVisible: boolean;
  onClose: () => void;
  isSaving?: boolean;
};

export function NftAvatarGallery ({ onSelect, isVisible, onClose, isSaving }: Props) {
  const [user] = useUser();
  const { nfts, isLoading } = useMyNfts();

  const getIsSelected = (nft: NftData) => {
    if (!user) {
      return false;
    }

    return user.avatarContract?.toLowerCase() === nft.contract.toLowerCase()
    && user.avatarTokenId?.toLowerCase() === nft.tokenId.toLowerCase()
    && user.avatarChain === nft.chainId;
  };

  return (
    <Dialog onClose={onClose} open={isVisible} scroll='paper'>
      <DialogTitle>Your NFTs gallery</DialogTitle>

      <DialogContent dividers sx={{ position: 'relative' }}>
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
            )) : <Box sx={{ p: 4, textAlign: 'center' }}><Typography>You do not own any NFTs</Typography></Box>}
          </Grid>
        )}

        {isSaving && (
        <Box sx={{ position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
