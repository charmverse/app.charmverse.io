import { Stack } from '@mui/system';

import { useUser } from 'hooks/useUser';

import { useMemberCollections } from '../../hooks/useMemberCollections';
import { NftsList } from '../NftsList';
import { PoapsList } from '../PoapsList';

import { ProfileWidget } from './ProfileWidget';

export function CollectionWidget({ userId }: { userId: string }) {
  const { isFetchingNfts, isFetchingPoaps, mutateNfts, nfts, nftsError, poaps, poapsError } = useMemberCollections({
    memberId: userId
  });

  const { user } = useUser();

  const pinnedNfts = nfts.filter((nft) => nft.isPinned);
  const hideCollections = pinnedNfts.length === 0 && poaps.length === 0 && !isFetchingNfts && !isFetchingPoaps;

  return (
    <ProfileWidget title='Collection' emptyContent={hideCollections ? 'User does not have any collections' : null}>
      <Stack spacing={2}>
        <NftsList
          userId={userId}
          nfts={nfts}
          nftsError={nftsError}
          isFetchingNfts={isFetchingNfts}
          mutateNfts={mutateNfts}
          readOnly={user?.id !== userId}
        />
        <PoapsList poaps={poaps} poapsError={poapsError} isFetchingPoaps={isFetchingPoaps} />
      </Stack>
    </ProfileWidget>
  );
}
