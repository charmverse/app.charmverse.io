import { Stack } from '@mui/material';
import type { KeyedMutator } from 'swr';

import { useUser } from 'hooks/useUser';
import type { NFTData } from '@packages/lib/blockchain/getNFTs';
import type { ExtendedPoap } from '@packages/lib/blockchain/interfaces';

import { ProfileWidget } from '../ProfileWidget';

import { NftsList } from './NftsList';
import { PoapsList } from './PoapsList';

export function CollectionWidget({
  userId,
  mutateNfts,
  nfts,
  poaps,
  readOnly
}: {
  userId: string;
  nfts: NFTData[];
  poaps: ExtendedPoap[];
  mutateNfts: KeyedMutator<NFTData[]>;
  readOnly?: boolean;
}) {
  const { user } = useUser();

  return (
    <ProfileWidget title='Collection'>
      <Stack spacing={2}>
        {nfts.length !== 0 && (
          <NftsList userId={userId} nfts={nfts} mutateNfts={mutateNfts} readOnly={readOnly || user?.id !== userId} />
        )}
        {poaps.length !== 0 && <PoapsList poaps={poaps} />}
      </Stack>
    </ProfileWidget>
  );
}
