import CancelIcon from '@mui/icons-material/Cancel';
import { Link, Tooltip, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { useState } from 'react';
import type { KeyedMutator } from 'swr';

import Avatar from 'components/common/Avatar';
import { useUser } from 'hooks/useUser';
import type { NftData } from 'lib/blockchain/interfaces';
import { transformNft } from 'lib/blockchain/transformNft';

import NftAvatarGalleryPopup from '../../NftAvatarGallery/NftAvatarGalleryPopup';

import { ProfileItemContainer, NonPinnedItem } from './ProfileItemContainer';
import { updateProfileItem } from './utils';

const totalShownNfts = 5;

type Props = { memberId: string; nfts: NftData[]; mutateNfts?: KeyedMutator<NftData[]> };

export function NftsList({ mutateNfts, memberId, nfts }: Props) {
  const { user: currentUser } = useUser();
  const pinnedNfts = nfts.filter((nft) => nft.isPinned);
  const emptyNftsCount = totalShownNfts - pinnedNfts.length;
  const [showingNftGallery, setIsShowingNftGallery] = useState(false);
  const readOnly = mutateNfts === undefined;

  async function updateNft(nft: NftData) {
    await updateProfileItem<NftData>(nft, mutateNfts);
    setIsShowingNftGallery(false);
  }

  return (
    <Stack gap={1}>
      <Typography variant='h6'>NFTs</Typography>
      <Stack gap={2} display='flex' flexDirection='row'>
        {pinnedNfts.map((nft) => {
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
        })}
        {currentUser?.id === memberId ? (
          new Array(emptyNftsCount).fill(0).map((_, i) => (
            <NonPinnedItem
              onClick={() => {
                if (!readOnly) {
                  setIsShowingNftGallery(true);
                }
              }}
              key={`${i.toString()}`}
            />
          ))
        ) : pinnedNfts.length === 0 ? (
          <Typography color='secondary'>No pinned NFTs</Typography>
        ) : null}
        {showingNftGallery && (
          <NftAvatarGalleryPopup
            isVisible
            onClose={() => {
              setIsShowingNftGallery(false);
            }}
            onSelect={updateNft}
            hiddenNfts={pinnedNfts.map((pinnedNft) => pinnedNft.id)}
          />
        )}
      </Stack>
    </Stack>
  );
}
