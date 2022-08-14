import React from 'react';
import { useMyNfts } from 'hooks/useMyNfts';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';

import { NftData } from 'lib/nft/types';
import NftAvatarGallery from './NftAvatarGallery';

type Props = {
  onSelect?: (avatar: NftData) => void
  isVisible: boolean;
  onClose: () => void;
  isSaving?: boolean;
};

export default function NftAvatarGalleryPopup ({ onSelect, isVisible, onClose, isSaving }: Props) {
  const { nfts, isLoading } = useMyNfts();

  return (
    <Dialog onClose={onClose} open={isVisible} scroll='paper'>
      <DialogTitle>Your NFTs gallery</DialogTitle>

      <DialogContent dividers>
        <NftAvatarGallery
          nfts={nfts}
          isLoading={isLoading}
          onSelect={onSelect}
          isSaving={isSaving}
          emptyMessage='You do not own any NFTs'
        />
      </DialogContent>
    </Dialog>
  );
}
