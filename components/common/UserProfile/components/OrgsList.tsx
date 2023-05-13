import CancelIcon from '@mui/icons-material/Cancel';
import { Grid, Tooltip, Typography, Stack } from '@mui/material';
import Alert from '@mui/material/Alert';
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

type Props = { userId: string; readOnly?: boolean };

export function OrgsList({ userId, readOnly = false }: Props) {
  const { user: currentUser } = useUser();
  const {
    data: orgs = [],
    mutate: mutateOrgs,
    isLoading: isFetchingOrgs,
    error
  } = useSWRImmutable(`/orgs/${userId}`, () => {
    return charmClient.profile.getOrgs(userId);
  });

  const pinnedOrgs = orgs.filter((org) => org.isPinned);
  const nonPinnedOrgs = orgs.filter((org) => !org.isPinned);
  const emptyOrgsCount = totalShownOrgs - pinnedOrgs.length;
  const [showingOrgsGallery, setIsShowingOrgsGallery] = useState(false);

  async function updateOrg(org: UserCommunity) {
    await updateProfileItem<UserCommunity>(org, 'community', org.walletId, mutateOrgs);
    setIsShowingOrgsGallery(false);
  }

  return (
    <Stack gap={1} data-test='member-profile-org-list'>
      <Typography variant='h6'>Organizations</Typography>
      {error && (
        <Grid item>
          <Alert severity='error'>Failed to fetch your token organizations</Alert>
        </Grid>
      )}
      {!error &&
        (isFetchingOrgs ? (
          <LoadingComponent isLoading />
        ) : (
          <Stack gap={2} display='flex' flexDirection='row' flexWrap='wrap'>
            {pinnedOrgs
              .sort((org1, org2) => (org1.name > org2.name ? 1 : -1))
              .map((pinnedOrg) => {
                return (
                  <ProfileItemContainer key={pinnedOrg.id}>
                    {!readOnly && (
                      <CancelIcon
                        color='error'
                        fontSize='small'
                        className='icons'
                        onClick={() => updateOrg(pinnedOrg)}
                      />
                    )}
                    <Tooltip title={pinnedOrg.name}>
                      <div>
                        <Avatar size='large' name={pinnedOrg.name} avatar={pinnedOrg.logo} />
                      </div>
                    </Tooltip>
                  </ProfileItemContainer>
                );
              })}
            {currentUser?.id === userId && emptyOrgsCount !== 0 ? (
              <Tooltip title='Add up to 5 orgs'>
                <div>
                  <NonPinnedItem
                    onClick={() => {
                      if (!readOnly) {
                        setIsShowingOrgsGallery(true);
                      }
                    }}
                  />
                </div>
              </Tooltip>
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
        ))}
    </Stack>
  );
}
