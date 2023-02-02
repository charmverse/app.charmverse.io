import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import { Link, Typography } from '@mui/material';
import { Box, Stack } from '@mui/system';
import type { ProfileItem } from '@prisma/client';
import { useState } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import { useUser } from 'hooks/useUser';
import type { NftData } from 'lib/blockchain/interfaces';
import { transformNft } from 'lib/blockchain/transformNft';

import NftAvatarGalleryPopup from '../NftAvatarGallery/NftAvatarGalleryPopup';

import { ProfileItemContainer } from './ProfileItemContainer';

const totalShownNfts = 5;

const NonPinnedBox = styled(Box)`
  width: 54px;
  height: 54px;
  display: flex;
  justify-content: center;
  align-items: center;
  ${({ theme }) => `border: 2px solid ${theme.palette.secondary.main}`};
  cursor: pointer;
`;

function NonPinnedNftBox({ onClick }: { onClick: VoidFunction }) {
  return (
    <NonPinnedBox onClick={onClick}>
      <AddIcon color='secondary' />
    </NonPinnedBox>
  );
}

type Props = { memberId: string; nfts: NftData[]; mutateNfts?: KeyedMutator<NftData[]> };

export function NftsList({ mutateNfts, memberId, nfts }: Props) {
  const { user: currentUser } = useUser();
  const pinnedNfts = nfts.filter((nft) => nft.isPinned);
  const emptyNftsCount = totalShownNfts - pinnedNfts.length;
  const [showingNftGallery, setIsShowingNftGallery] = useState(false);
  const readOnly = mutateNfts === undefined;

  async function updateNft(nft: NftData) {
    const profileItem: Omit<ProfileItem, 'userId'> = {
      id: nft.id,
      isHidden: nft.isHidden,
      type: 'nft',
      metadata: null,
      isPinned: !nft.isPinned
    };

    await charmClient.profile.updateProfileItem({
      profileItems: [profileItem]
    });

    if (mutateNfts) {
      await mutateNfts(
        (cachedNfts) => {
          if (!cachedNfts) {
            return [];
          }

          return cachedNfts.map((cachedNft) =>
            cachedNft.id === nft.id ? { ...cachedNft, isPinned: !nft.isPinned } : cachedNft
          );
        },
        { revalidate: false }
      );
    }

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
              <Link href={nftData.link} target='_blank' display='flex'>
                <Avatar size='large' isNft avatar={nftData.image} />
              </Link>
            </ProfileItemContainer>
          );
        })}
        {currentUser?.id === memberId ? (
          new Array(emptyNftsCount).fill(0).map((_, i) => (
            <NonPinnedNftBox
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
