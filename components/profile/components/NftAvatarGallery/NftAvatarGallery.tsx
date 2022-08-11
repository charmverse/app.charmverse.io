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

type Props = {
  currentAvatar?: UserAvatar,
  onSelect?: (avatar: UserAvatar) => void
  isVisible: boolean;
  onClose: () => void
};

export function NftAvatarGallery ({ currentAvatar, onSelect, isVisible, onClose }: Props) {
  const { nfts, isLoading } = useMyNfts();

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
                <NftGalleryItem nft={nft} isSelected={false} />
              </Grid>
            )) : <Box sx={{ p: 4, textAlign: 'center' }}><Typography>You do not own any NFTs</Typography></Box>}
          </Grid>
        )}
      </DialogContent>
    </Dialog>
  );
}
