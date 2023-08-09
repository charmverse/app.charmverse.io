import { Chip, Stack } from '@mui/material';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import MultiTabs from 'components/common/MultiTabs';
import { ProfileWidgets } from 'components/common/UserProfile/components/ProfileWidgets/ProfileWidgets';
import Legend from 'components/settings/Legend';
import { useUser } from 'hooks/useUser';
import type { Member } from 'lib/members/interfaces';
import type { LoggedInUser } from 'models';
import type { PublicUser } from 'pages/api/public/profile/[userId]';

import type { CommunityDetails } from './components/CommunityRow';
import CommunityRow from './components/CommunityRow';
import { UserDetailsFormWithSave } from './components/UserDetails/UserDetailsForm';
import { UserDetailsReadonly } from './components/UserDetails/UserDetailsReadonly';
import { isPublicUser } from './components/UserDetails/utils';
import { UserSpacesList } from './components/UserSpacesList/UserSpacesList';

export function PublicProfile(props: { user: Member | PublicUser | LoggedInUser; readOnly?: boolean }) {
  const { user, readOnly } = props;
  const { user: currentUser } = useUser();

  const {
    data,
    mutate,
    isLoading: isAggregatedDataLoading,
    isValidating: isAggregatedDataValidating
  } = useSWRImmutable(user ? `userAggregatedData/${user.id}` : null, () => charmClient.getAggregatedData(user.id));
  const isPublic = isPublicUser(user, currentUser);

  const isLoading = isAggregatedDataLoading || isAggregatedDataValidating || !data;

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

  const communities = (data?.communities ?? []).filter((community) => (isPublic ? !community.isHidden : true));

  const allCommunities = communities.sort((commA, commB) => (commB.joinDate > commA.joinDate ? 1 : -1));
  return (
    <Stack spacing={2}>
      {readOnly ? <UserDetailsReadonly {...props} /> : <UserDetailsFormWithSave user={props.user as LoggedInUser} />}
      <MultiTabs
        tabs={[
          ['Profile', <ProfileWidgets key='profile' userId={props.user.id} />],
          [
            'Organizations',
            <Stack key='organizations'>
              <UserSpacesList userId={props.user.id} />
              <SectionHeader title='My Organizations' count={data ? allCommunities.length : undefined} />
              <LoadingComponent isLoading={isLoading} minHeight={300}>
                {allCommunities.length > 0 ? (
                  <Stack gap={2} mb={2}>
                    {allCommunities.map((community) => (
                      <CommunityRow
                        key={community.id}
                        onClick={() => {
                          toggleCommunityVisibility(community);
                        }}
                        visible={!community.isHidden}
                        showVisibilityIcon={!readOnly}
                        community={community}
                      />
                    ))}
                  </Stack>
                ) : null}
              </LoadingComponent>
            </Stack>
          ]
        ]}
      />
    </Stack>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <Stack flexDirection='row' justifyContent='space-between' alignItems='center' my={2}>
      <Legend noBorder>{title}</Legend>
      {typeof count !== 'undefined' && <Chip label={count} />}
    </Stack>
  );
}
