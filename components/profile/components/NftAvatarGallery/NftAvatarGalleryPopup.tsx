import SearchIcon from '@mui/icons-material/Search';
import { Dialog, DialogContent, DialogTitle, TextField } from '@mui/material';
import { useMemo, useState } from 'react';

import { useMyNfts } from 'hooks/useMyNfts';
import { useUser } from 'hooks/useUser';
import type { NftData } from 'lib/blockchain/interfaces';

import NftAvatarGallery from './NftAvatarGallery';

type Props = {
  onSelect?: (avatar: NftData) => void;
  isVisible: boolean;
  onClose: () => void;
  isSaving?: boolean;
  showSearchBar?: boolean;
};

export default function NftAvatarGalleryPopup({
  onSelect,
  isVisible,
  onClose,
  isSaving,
  showSearchBar = false
}: Props) {
  const { user } = useUser();
  const { nfts = [], isLoading } = useMyNfts(user?.id || '');
  const [searchedTerm, setSearchedTerm] = useState('');

  const filteredNfts = useMemo(() => {
    if (searchedTerm.length === 0) {
      return nfts;
    }
    return nfts.filter((nft) => nft.title.toLowerCase().includes(searchedTerm.toLowerCase()));
  }, [nfts, searchedTerm]);

  return (
    <Dialog onClose={onClose} open={isVisible} scroll='paper'>
      <DialogTitle>Your NFTs gallery</DialogTitle>
      <DialogContent dividers>
        {showSearchBar && !isLoading && (
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
