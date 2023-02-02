import SearchIcon from '@mui/icons-material/Search';
import { Dialog, DialogContent, TextField } from '@mui/material';
import { useMemo, useState } from 'react';

import { DialogTitle } from 'components/common/Modal';
import { useMyNfts } from 'hooks/useMyNfts';
import { useUser } from 'hooks/useUser';
import type { NftData } from 'lib/blockchain/interfaces';

import NftAvatarGallery from './NftAvatarGallery';

type Props = {
  onSelect?: (avatar: NftData) => void;
  isVisible: boolean;
  onClose: () => void;
  isSaving?: boolean;
  hiddenNfts?: string[];
};

export default function NftAvatarGalleryPopup({ onSelect, isVisible, onClose, isSaving, hiddenNfts = [] }: Props) {
  const { user } = useUser();
  const { nfts = [], isLoading } = useMyNfts(user?.id || '');
  const [searchedTerm, setSearchedTerm] = useState('');

  const filteredNfts = useMemo(() => {
    return (
      searchedTerm.length === 0
        ? nfts
        : nfts.filter((nft) => nft.title.toLowerCase().includes(searchedTerm.toLowerCase()))
    ).filter((nft) => !hiddenNfts.includes(nft.id));
  }, [nfts, searchedTerm, hiddenNfts]);

  return (
    <Dialog onClose={onClose} open={isVisible} scroll='paper'>
      <DialogTitle sx={{ '&&': { px: 2, py: 2 } }} onClose={onClose}>
        Your NFTs gallery
      </DialogTitle>
      <DialogContent dividers>
        {!isLoading && nfts.length !== 0 && (
          <TextField
            fullWidth
            sx={{
              mb: 2
            }}
            onChange={(e) => setSearchedTerm(e.target.value)}
            value={searchedTerm}
            placeholder='Search for NFT'
            InputProps={{
              startAdornment: <SearchIcon color='secondary' sx={{ mr: 1 }} fontSize='small' />
            }}
          />
        )}
        <NftAvatarGallery
          nfts={filteredNfts}
          isLoading={isLoading}
          onSelect={onSelect}
          isSaving={isSaving}
          emptyMessage='You do not own any NFTs'
        />
      </DialogContent>
    </Dialog>
  );
}
