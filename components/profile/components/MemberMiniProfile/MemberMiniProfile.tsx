import { Dialog, DialogContent, Divider, Typography, useMediaQuery, Box, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { MemberProperty, MemberPropertyType } from '@prisma/client';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { DialogTitle } from 'components/common/Modal';
import { UserDetails } from 'components/profile/components';
import { MemberPropertiesRenderer } from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesRenderer';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type { Member } from 'lib/members/interfaces';

import { MemberPropertiesPopup } from '../SpacesMemberDetails/components/MemberPropertiesPopup';

import { NftsList } from './BlockchainData/NftsList';
import { OrgsList } from './BlockchainData/OrgsList';
import { PoapsList } from './BlockchainData/PoapsList';

function MemberProfile({
  cancelButtonText,
  title,
  member,
  onClose
}: {
  cancelButtonText?: string;
  title?: string;
  member: Member;
  onClose: VoidFunction;
}) {
  const { mutateMembers } = useMembers();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { user: currentUser, setUser } = useUser();
  const currentSpace = useCurrentSpace();
  const { properties = [] } = useMemberProperties();
  const propertiesRecord = properties.reduce((record, prop) => {
    record[prop.type] = prop;
    return record;
  }, {} as Record<MemberPropertyType, MemberProperty>);

  const { memberPropertyValues = [] } = useMemberPropertyValues(member.id);
  const currentSpacePropertyValues = memberPropertyValues.find(
    (memberPropertyValue) => memberPropertyValue.spaceId === currentSpace?.id
  );
  const { updateSpaceValues } = useMemberPropertyValues(member.id);

  const username =
    (member.properties?.find((memberProperty) => memberProperty.memberPropertyId === propertiesRecord.name?.id)
      ?.value as string) ?? member.username;

  const { data: user, isLoading: isFetchingUser } = useSWR(`users/${member.path}`, () =>
    charmClient.getUserByPath(member.path as string)
  );

  const isLoading = isFetchingUser;

  if (!currentSpace || !currentUser) {
    return null;
  }

  if (member.id === currentUser.id) {
    return (
      <MemberPropertiesPopup
        title={title && title.length !== 0 ? title : 'Edit your profile'}
        onClose={() => {
          mutateMembers();
          onClose();
        }}
        isLoading={isLoading}
        memberId={currentUser.id}
        spaceId={currentSpace.id}
        updateMemberPropertyValues={updateSpaceValues}
        cancelButtonText={cancelButtonText && cancelButtonText.length !== 0 ? cancelButtonText : 'Cancel'}
        postComponent={
          user && (
            <Stack gap={3}>
              <Divider
                sx={{
                  mt: 3
                }}
              />
              <NftsList memberId={user.id} />
              <OrgsList memberId={user.id} />
              <PoapsList memberId={user.id} />
            </Stack>
          )
        }
      >
        {user && (
          <UserDetails
            sx={{
              mt: 0
            }}
            // currentUser doesn't have profile thus is not considered as publicUser inside UserDetails
            // giving the ability to update the profile properties
            user={user.id === currentUser?.id ? currentUser : user}
            updateUser={setUser}
          />
        )}
        <Typography fontWeight={600}>Member details</Typography>
      </MemberPropertiesPopup>
    );
  }

  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen}>
      {isLoading || !user ? (
        <DialogContent>
          <LoadingComponent isLoading />
        </DialogContent>
      ) : (
        <>
          <DialogTitle
            sx={{ '&&': { px: 2, py: 2 }, display: 'flex', justifyContent: 'space-between' }}
            onClose={onClose}
          >
            <Stack display='flex' flexDirection='row' width='100%' alignItems='center' justifyContent='space-between'>
              <Typography variant='h6'>{username}'s profile</Typography>
              <Button
                onClick={onClose}
                href={`/u/${user.path}`}
                color='secondary'
                variant='outlined'
                sx={{
                  mx: 1
                }}
              >
                View full profile
              </Button>
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            <UserDetails user={user} readOnly />
            {currentSpacePropertyValues && (
              <Box my={3}>
                <MemberPropertiesRenderer properties={currentSpacePropertyValues.properties} />
              </Box>
            )}

            <Stack gap={3}>
              <NftsList memberId={user.id} readOnly />
              <OrgsList memberId={user.id} readOnly />
              <PoapsList memberId={user.id} />
            </Stack>
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}

export function MemberMiniProfile({
  memberId,
  onClose,
  title,
  cancelButtonText
}: {
  cancelButtonText?: string;
  title?: string;
  memberId: string;
  onClose: VoidFunction;
}) {
  const { members } = useMembers();
  const member = members.find((_member) => _member.id === memberId);

  if (!member) {
    return null;
  }

  return <MemberProfile title={title} cancelButtonText={cancelButtonText} member={member} onClose={onClose} />;
}
