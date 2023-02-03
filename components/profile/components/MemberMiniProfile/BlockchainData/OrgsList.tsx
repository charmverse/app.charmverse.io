import CancelIcon from '@mui/icons-material/Cancel';
import { Tooltip, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { useState } from 'react';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import LoadingComponent from 'components/common/LoadingComponent';
import { useUser } from 'hooks/useUser';
import type { UserCommunity } from 'lib/profile';

import { OrgsGalleryPopup } from './OrgsGalleryPopup';
import { NonPinnedItem, ProfileItemContainer } from './ProfileItemContainer';
import { updateProfileItem } from './utils';

const totalShownOrgs = 5;

type Props = { memberId: string; readOnly?: boolean };

export function OrgsList({ memberId, readOnly = false }: Props) {
  const { user: currentUser } = useUser();
  const {
    data: orgs = [],
    mutate: mutateOrgs,
    isLoading: isFetchingOrgs
  } = useSWRImmutable(`/orgs/${memberId}`, () => {
    return charmClient.profile.getOrgs(memberId);
  });

  const pinnedOrgs = orgs.filter((org) => org.isPinned);
  const nonPinnedOrgs = orgs.filter((org) => !org.isPinned);
  const emptyOrgsCount = totalShownOrgs - pinnedOrgs.length;
  const [showingOrgsGallery, setIsShowingOrgsGallery] = useState(false);

  async function updateOrg(org: UserCommunity) {
    await updateProfileItem<UserCommunity>(org, 'community', mutateOrgs);
    setIsShowingOrgsGallery(false);
  }

  return (
    <Stack gap={1}>
      <Typography variant='h6'>Organizations</Typography>
      {isFetchingOrgs ? (
        <LoadingComponent isLoading />
      ) : (
        <Stack gap={2} display='flex' flexDirection='row'>
          {pinnedOrgs.map((pinnedOrg) => {
            return (
              <ProfileItemContainer key={pinnedOrg.id}>
                {!readOnly && (
                  <CancelIcon color='error' fontSize='small' className='icons' onClick={() => updateOrg(pinnedOrg)} />
                )}
                <Tooltip title={pinnedOrg.name}>
                  <div>
                    <Avatar size='large' name={pinnedOrg.name} avatar={pinnedOrg.logo} />
                  </div>
                </Tooltip>
              </ProfileItemContainer>
            );
          })}
          {currentUser?.id === memberId ? (
            new Array(emptyOrgsCount).fill(0).map((_, i) => (
              <NonPinnedItem
                onClick={() => {
                  if (!readOnly) {
                    setIsShowingOrgsGallery(true);
                  }
                }}
                key={`${i.toString()}`}
              />
            ))
          ) : pinnedOrgs.length === 0 ? (
            <Typography color='secondary'>No pinned Organizations</Typography>
          ) : null}

          {showingOrgsGallery && (
            <OrgsGalleryPopup
              onClose={() => {
                setIsShowingOrgsGallery(false);
              }}
              orgs={nonPinnedOrgs}
              onSelect={updateOrg}
            />
          )}
        </Stack>
      )}
    </Stack>
  );
}
