import CancelIcon from '@mui/icons-material/Cancel';
import { Alert, Grid, Link, Stack, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import type { KeyedMutator } from 'swr';

import Avatar from 'components/common/Avatar';
import LoadingComponent from 'components/common/LoadingComponent';
import { useUser } from 'hooks/useUser';
import type { NftData } from 'lib/blockchain/interfaces';
import { transformNft } from 'lib/blockchain/transformNft';

import { NftAvatarGalleryPopup } from './NftAvatarGallery/NftAvatarGalleryPopup';
import { NonPinnedItem, ProfileItemContainer } from './ProfileItemContainer';
import { updateProfileItem } from './utils';

const totalShownNfts = 5;

type Props = {
  userId: string;
  readOnly?: boolean;
  isFetchingNfts: boolean;
  mutateNfts: KeyedMutator<NftData[]>;
  nftsError: any;
  nfts: NftData[];
};

export function NftsList({ userId, readOnly = false, isFetchingNfts, mutateNfts, nfts, nftsError }: Props) {
  const { user: currentUser } = useUser();
  const [showingNftGallery, setIsShowingNftGallery] = useState(false);

  const pinnedNfts = nfts.filter((nft) => nft.isPinned);
  const emptyNftsCount = totalShownNfts - pinnedNfts.length;

  async function updateNft(nft: NftData) {
    await updateProfileItem<NftData>(nft, 'nft', nft.walletId, mutateNfts);
    setIsShowingNftGallery(false);
  }

  return (
    <Stack gap={1} data-test='member-profile-nft-list'>
      <Typography variant='h6'>NFTs</Typography>
      {nftsError && (
        <Grid item>
          <Alert severity='error'>Failed to fetch your NFTs</Alert>
        </Grid>
      )}
      {!nftsError &&
        (isFetchingNfts ? (
          <LoadingComponent isLoading />
        ) : (
          <Stack gap={2} display='flex' flexDirection='row'>
            {pinnedNfts.length === 0 && readOnly ? (
              <Typography color='secondary'>No pinned NFTs</Typography>
            ) : (
              pinnedNfts
                .sort((nft1, nft2) => (nft1.title > nft2.title ? 1 : -1))
                .map((nft) => {
                  const nftData = transformNft(nft);
                  return (
                    <ProfileItemContainer key={nft.id}>
                      {!readOnly && (
                        <CancelIcon color='error' fontSize='small' className='icons' onClick={() => updateNft(nft)} />
                      )}
                      <Tooltip title={nftData.title}>
                        <Link href={nftData.link} target='_blank' display='flex'>
                          <Avatar size='large' isNft avatar={nftData.image} />
                        </Link>
                      </Tooltip>
                    </ProfileItemContainer>
                  );
                })
            )}
            {currentUser?.id === userId && emptyNftsCount !== 0 ? (
              <Tooltip title='Add upto 5 NFTs'>
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
