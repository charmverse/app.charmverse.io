import React from 'react';
import { UserAvatar } from 'lib/users/interfaces';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import { useMyNfts } from 'hooks/useMyNfts';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

import Grid from '@mui/material/Grid';

import { DialogContent, Typography } from '@mui/material';
import { NftGalleryItem } from 'components/profile/components/NftAvatarGallery/NftGalleryItem';
import Box from '@mui/system/Box';
import { NftData } from 'lib/nft/types';
import { useUser } from 'hooks/useUser';

type Props = {
  onSelect?: (avatar: NftData) => void
  isVisible: boolean;
  onClose: () => void
};

export function NftAvatarGallery ({ onSelect, isVisible, onClose }: Props) {
  const [user] = useUser();
  const { nfts, isLoading } = useMyNfts();

  const getIsSelected = (nft: NftData) => {
    if (!user) {
      return false;
    }

    return user.avatarContract?.toLowerCase() === nft.contract.toLowerCase()
    && user.avatarTokenId?.toLowerCase() === nft.tokenId.toLowerCase()
    && user.avatarTokenChain === nft.chainId;
  };

  return (
    <Dialog onClose={onClose} open={isVisible} scroll='paper'>
      <DialogTitle>Your NFTs gallery</DialogTitle>

      <DialogContent dividers>
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
      </DialogContent>
    </Dialog>
  );
}
