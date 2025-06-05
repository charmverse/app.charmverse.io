import CancelIcon from '@mui/icons-material/Cancel';
import { Alert, Grid, Link, Stack, Tooltip, Typography } from '@mui/material';
import type { NFTData } from '@packages/lib/blockchain/getNFTs';
import { useState } from 'react';
import type { KeyedMutator } from 'swr';

import Avatar from 'components/common/Avatar';
import LoadingComponent from 'components/common/LoadingComponent';
import { useUser } from 'hooks/useUser';

import { updateProfileItem } from '../../../../utils';
import { NonPinnedItem, ProfileItemContainer } from '../../../ProfileItemContainer';

import { NftAvatarGalleryPopup } from './NftAvatarGallery/NftAvatarGalleryPopup';

const totalShownNfts = 5;

type Props = {
  userId: string;
  readOnly?: boolean;
  isFetchingNfts?: boolean;
  mutateNfts: KeyedMutator<NFTData[]>;
  nftsError?: any;
  nfts: NFTData[];
};

export function NftsList({ userId, readOnly = false, isFetchingNfts, mutateNfts, nfts, nftsError }: Props) {
  const { user: currentUser } = useUser();
  const [showingNftGallery, setIsShowingNftGallery] = useState(false);

  const pinnedNfts = nfts.filter((nft) => nft.isPinned);
  const emptyNftsCount = totalShownNfts - pinnedNfts.length;

  async function updateNft(nft: NFTData) {
    await updateProfileItem<NFTData>(nft, 'nft', nft.walletId, mutateNfts);
    setIsShowingNftGallery(false);
  }

  return (
    <Stack gap={1} data-test='member-profile-nft-list'>
      <Typography variant='h6'>NFTs</Typography>
      {nftsError && (
        <Grid>
          <Alert severity='error'>Failed to fetch your NFTs</Alert>
        </Grid>
      )}
      {!nftsError &&
        (isFetchingNfts ? (
          <LoadingComponent isLoading />
        ) : (
          <Stack gap={2} display='flex' flexDirection='row' flexWrap='wrap'>
            {pinnedNfts.length === 0 && readOnly ? (
              <Typography color='secondary'>No pinned NFTs</Typography>
            ) : (
              pinnedNfts
                .sort((nft1, nft2) => (nft1.title > nft2.title ? 1 : -1))
                .map((nft) => {
                  return (
                    <ProfileItemContainer key={nft.id}>
                      {!readOnly && (
                        <CancelIcon color='error' fontSize='small' className='icons' onClick={() => updateNft(nft)} />
                      )}
                      <Tooltip title={nft.title}>
                        <Link href={nft.link} target='_blank' display='flex'>
                          <Avatar size='large' isNft avatar={nft.image ?? nft.imageThumb} />
                        </Link>
                      </Tooltip>
                    </ProfileItemContainer>
                  );
                })
            )}
            {!readOnly && currentUser?.id === userId && emptyNftsCount !== 0 ? (
              <Tooltip title='Add up to 5 NFTs'>
                <div>
                  <NonPinnedItem
                    onClick={() => {
                      if (!readOnly) {
                        setIsShowingNftGallery(true);
                      }
                    }}
                  />
                </div>
              </Tooltip>
            ) : null}
            {showingNftGallery && (
              <NftAvatarGalleryPopup
                disableAutoSelectAvatarNft
                isVisible
                onClose={() => {
                  setIsShowingNftGallery(false);
                }}
                onSelect={updateNft}
                hiddenNfts={pinnedNfts.map((pinnedNft) => pinnedNft.id)}
              />
            )}
          </Stack>
        ))}
    </Stack>
  );
}
