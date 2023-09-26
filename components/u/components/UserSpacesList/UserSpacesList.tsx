import { Box, Stack } from '@mui/material';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { MemberPropertiesForm } from 'components/common/UserProfile/components/MemberPropertiesForm';
import { useMemberPropertyValues } from 'components/common/UserProfile/hooks/useMemberPropertyValues';
import { UserProfileDialog } from 'components/common/UserProfile/UserProfileDialog';
import Legend from 'components/settings/Legend';
import { useUser } from 'hooks/useUser';
import type { UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';
import type { CommunityDetails } from 'lib/profile/interfaces';

import { UserSpacesListItem } from './components/UserSpacesListItem';

type Props = {
  userId: string;
};

export function UserSpacesList({ userId }: Props) {
  const {
    isLoading: isSpaceDataLoading,
    memberPropertyValues,
    canEditSpaceProfile,
    updateSpaceValues,
    refreshPropertyValues
  } = useMemberPropertyValues(userId);
  const { user: currentUser } = useUser();
  const {
    data,
    mutate,
    isLoading: isAggregatedDataLoading,
    isValidating: isAggregatedDataValidating
  } = useSWRImmutable(userId ? `userAggregatedData/${userId}` : null, () => charmClient.getAggregatedData(userId));
  const isNotSelf = userId !== currentUser?.id;

  const [editSpaceId, setEditSpaceId] = useState<null | string>(null);
  const [memberDetails, setMemberDetails] = useState<UpdateMemberPropertyValuePayload[]>([]);
  const { user } = useUser();
  const readOnly = userId !== user?.id;

  const memberProperties = useMemo(
    () =>
      memberPropertyValues
        ?.filter((mpv) => mpv.spaceId === editSpaceId)
        .map((mpv) => mpv.properties)
        .flat(),
    [memberPropertyValues, editSpaceId]
  );

  function onMemberDetailsChange(fields: UpdateMemberPropertyValuePayload[]) {
    setMemberDetails(fields);
  }

  async function saveForm(spaceId: string) {
    await updateSpaceValues(spaceId, memberDetails);
    setEditSpaceId(null);
    setMemberDetails([]);
  }

  const isFormClean = memberDetails.length === 0;

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

  const canEdit = (spaceId: string) => canEditSpaceProfile(spaceId) && !readOnly;

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
              onEdit={canEdit(space.id) ? () => setEditSpaceId(space.id) : undefined}
              visible={!space.isHidden}
              properties={memberPropertyValues?.find((value) => value.spaceId === space.id)?.properties || []}
              showVisibilityIcon={!readOnly}
              space={space}
            />
          ))}
        </Stack>
      ) : null}

      {editSpaceId && (
        <UserProfileDialog title='Edit space profile' onClose={() => setEditSpaceId(null)}>
          <MemberPropertiesForm
            properties={memberProperties}
            userId={userId}
            refreshPropertyValues={refreshPropertyValues}
            onChange={onMemberDetailsChange}
          />
          <Box display='flex' justifyContent='flex-end' mt={2}>
            <Button disableElevation size='large' disabled={isFormClean} onClick={() => saveForm(editSpaceId)}>
              Save
            </Button>
          </Box>
        </UserProfileDialog>
      )}
    </Box>
  );
}
