import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import { Tooltip, Typography } from '@mui/material';
import { Box, Stack } from '@mui/system';
import type { ProfileItem } from '@prisma/client';
import { useState } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import { useUser } from 'hooks/useUser';
import type { UserCommunity } from 'lib/profile';

import { OrgsGalleryPopup } from './OrgsGalleryPopup';
import { ProfileItemContainer } from './ProfileItemContainer';

const totalShownOrgs = 5;

const NonPinnedBox = styled(Box)`
  width: 54px;
  height: 54px;
  display: flex;
  justify-content: center;
  align-items: center;
  ${({ theme }) => `border: 2px solid ${theme.palette.secondary.main}`};
  cursor: pointer;
`;

function NonPinnedOrgsBox({ onClick }: { onClick: VoidFunction }) {
  return (
    <NonPinnedBox onClick={onClick}>
      <AddIcon color='secondary' />
    </NonPinnedBox>
  );
}

type Props = { memberId: string; orgs: UserCommunity[]; mutateOrgs?: KeyedMutator<UserCommunity[]> };

export function OrgsList({ mutateOrgs, memberId, orgs }: Props) {
  const { user: currentUser } = useUser();
  const pinnedOrgs = orgs.filter((org) => org.isPinned);
  const nonPinnedOrgs = orgs.filter((org) => !org.isPinned);
  const emptyOrgsCount = totalShownOrgs - pinnedOrgs.length;
  const [showingOrgsGallery, setIsShowingOrgsGallery] = useState(false);
  const readOnly = mutateOrgs === undefined;

  async function updateOrg(org: UserCommunity) {
    const profileItem: Omit<ProfileItem, 'userId'> = {
      id: org.id,
      isHidden: org.isHidden,
      type: 'community',
      metadata: null,
      isPinned: !org.isPinned
    };

    await charmClient.profile.updateProfileItem({
      profileItems: [profileItem]
    });

    if (mutateOrgs) {
      await mutateOrgs(
        (cachedOrgs) => {
          if (!cachedOrgs) {
            return [];
          }

          return cachedOrgs.map((cachedOrg) =>
            cachedOrg.id === org.id ? { ...cachedOrg, isPinned: !org.isPinned } : cachedOrg
          );
        },
        { revalidate: false }
      );
    }

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
            <NonPinnedOrgsBox
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
