import { Box, Stack } from '@mui/material';
import type { CommunityDetails } from '@packages/profile/interfaces';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import { useUser } from 'hooks/useUser';

import { useMemberPropertyValues } from '../../../../hooks/useMemberPropertyValues';

import { UserSpacesListItem } from './components/UserSpacesListItem';

type Props = {
  userId: string;
};

export function UserSpacesList({ userId }: Props) {
  const { isLoading: isSpaceDataLoading, memberPropertyValues } = useMemberPropertyValues(userId);
  const { user: currentUser } = useUser();
  const {
    data,
    mutate,
    isLoading: isAggregatedDataLoading,
    isValidating: isAggregatedDataValidating
  } = useSWRImmutable(userId ? `userAggregatedData/${userId}` : null, () => charmClient.getAggregatedData(userId));
  const isNotSelf = userId !== currentUser?.id;

  const { user } = useUser();
  const readOnly = userId !== user?.id;
  const communities = data?.communities ?? [];
  const visibleCommunities = isNotSelf ? communities.filter((community) => !community.isHidden) : communities;

  visibleCommunities.sort((commA, commB) => (commB.joinDate > commA.joinDate ? 1 : -1));

  async function toggleCommunityVisibility(community: CommunityDetails) {
    if (currentUser) {
      await charmClient.profile.updateProfileItem({
        profileItems: [
          {
            id: community.id,
            isHidden: !community.isHidden,
            type: 'community',
            metadata: null,
            isPinned: false,
            walletId: community.walletId
          }
        ]
      });
      mutate(
        (aggregateData) => {
          return aggregateData
            ? {
                ...aggregateData,
                communities: aggregateData.communities.map((comm) => {
                  if (comm.id === community.id) {
                    return {
                      ...comm,
                      isHidden: !community.isHidden
                    };
                  }
                  return comm;
                })
              }
            : undefined;
        },
        {
          revalidate: false
        }
      );
    }
  }
  const isLoading = isSpaceDataLoading || isAggregatedDataLoading || isAggregatedDataValidating || !data;

  return (
    <Box mb={2}>
      <LoadingComponent minHeight={300} isLoading={isLoading} />
      {visibleCommunities.length > 0 ? (
        <Stack gap={2} mb={2}>
          {visibleCommunities.map((space) => (
            <UserSpacesListItem
              key={space.id}
              onClick={() => {
                toggleCommunityVisibility(space);
              }}
              visible={!space.isHidden}
              properties={memberPropertyValues?.find((value) => value.spaceId === space.id)?.properties || []}
              showVisibilityIcon={!readOnly}
              space={space}
            />
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}
