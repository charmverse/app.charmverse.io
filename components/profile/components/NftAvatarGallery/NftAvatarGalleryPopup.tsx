import { Dialog, DialogContent, DialogTitle } from '@mui/material';

import { useMyNfts } from 'hooks/useMyNfts';
import { useUser } from 'hooks/useUser';
import type { NftData } from 'lib/blockchain/interfaces';

import NftAvatarGallery from './NftAvatarGallery';

type Props = {
  onSelect?: (avatar: NftData) => void;
  isVisible: boolean;
  onClose: () => void;
  isSaving?: boolean;
};

export default function NftAvatarGalleryPopup ({ onSelect, isVisible, onClose, isSaving }: Props) {
  const { user } = useUser();
  const { nfts, isLoading } = useMyNfts(user?.id || '');

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
