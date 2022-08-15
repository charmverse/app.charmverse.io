import React from 'react';
import { useMyNfts } from 'hooks/useMyNfts';
import { Stack, Typography } from '@mui/material';

import { NftData } from 'lib/nft/types';
import NftAvatarGallery from 'components/profile/components/NftAvatarGallery';

type Props = {
  onSelect?: (avatar: NftData) => void
  isSaving?: boolean;
};

export default function NftAvatarSection ({ onSelect, isSaving }: Props) {
  const { nfts, isLoading } = useMyNfts();

  if (nfts?.length === 0) {
    return null;
  }

  return (
    <Stack alignItems='center' gap={1}>
      <Typography variant='subtitle2'>or</Typography>
      <Typography variant='h2'>Select an nft</Typography>
      <NftAvatarGallery
        nfts={nfts}
        isLoading={isLoading}
        onSelect={onSelect}
        isSaving={isSaving}
      />
    </Stack>
  );
}
