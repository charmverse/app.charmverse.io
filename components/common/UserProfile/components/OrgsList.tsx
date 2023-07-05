import CancelIcon from '@mui/icons-material/Cancel';
import { Grid, Stack, Tooltip, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import { useState } from 'react';
import type { KeyedMutator } from 'swr';

import Avatar from 'components/common/Avatar';
import LoadingComponent from 'components/common/LoadingComponent';
import { useUser } from 'hooks/useUser';
import type { UserCommunity } from 'lib/profile';

import { OrgsGalleryPopup } from './OrgsGalleryPopup';
import { NonPinnedItem, ProfileItemContainer } from './ProfileItemContainer';
import { updateProfileItem } from './utils';

const totalShownOrgs = 5;

type Props = {
  readOnly?: boolean;
  isFetchingOrgs: boolean;
  orgsError: any;
  orgs: UserCommunity[];
  userId: string;
  mutateOrgs: KeyedMutator<UserCommunity[]>;
};

export function OrgsList({ userId, readOnly = false, isFetchingOrgs, mutateOrgs, orgs, orgsError }: Props) {
  const { user: currentUser } = useUser();

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
      {orgsError && (
        <Grid item>
          <Alert severity='error'>Failed to fetch your token organizations</Alert>
        </Grid>
      )}
      {!orgsError &&
        (isFetchingOrgs ? (
          <LoadingComponent isLoading />
        ) : (
          <Stack gap={2} display='flex' flexDirection='row' flexWrap='wrap'>
            {readOnly && pinnedOrgs.length === 0 && <Typography color='secondary'>No pinned Orgs</Typography>}
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
