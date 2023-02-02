import CancelIcon from '@mui/icons-material/Cancel';
import { Tooltip, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { useState } from 'react';
import type { KeyedMutator } from 'swr';

import Avatar from 'components/common/Avatar';
import { useUser } from 'hooks/useUser';
import type { UserCommunity } from 'lib/profile';

import { OrgsGalleryPopup } from './OrgsGalleryPopup';
import { NonPinnedItem, ProfileItemContainer } from './ProfileItemContainer';
import { updateProfileItem } from './utils';

const totalShownOrgs = 5;

type Props = { memberId: string; orgs: UserCommunity[]; mutateOrgs?: KeyedMutator<UserCommunity[]> };

export function OrgsList({ mutateOrgs, memberId, orgs }: Props) {
  const { user: currentUser } = useUser();
  const pinnedOrgs = orgs.filter((org) => org.isPinned);
  const nonPinnedOrgs = orgs.filter((org) => !org.isPinned);
  const emptyOrgsCount = totalShownOrgs - pinnedOrgs.length;
  const [showingOrgsGallery, setIsShowingOrgsGallery] = useState(false);
  const readOnly = mutateOrgs === undefined;

  async function updateOrg(org: UserCommunity) {
    await updateProfileItem<UserCommunity>(org, mutateOrgs);
    setIsShowingOrgsGallery(false);
  }

  return (
    <Stack gap={1}>
      <Typography variant='h6'>Organizations</Typography>
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
    </Stack>
  );
}
