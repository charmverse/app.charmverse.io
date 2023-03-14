import { Dialog, DialogContent, Divider, Typography, useMediaQuery, Box, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { MemberProperty, MemberPropertyType } from '@prisma/client';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { DialogTitle } from 'components/common/Modal';
import { MemberEmailForm } from 'components/members/MemberEmailForm';
import { MemberPropertiesRenderer } from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesRenderer';
import UserDetails from 'components/profile/components/UserDetails/UserDetails';
import Legend from 'components/settings/Legend';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMemberProperties } from 'hooks/useMemberProperties';
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type { Member } from 'lib/members/interfaces';

import { MemberPropertiesPopup } from '../SpacesMemberDetails/components/MemberPropertiesPopup';
import UserDetailsMini from '../UserDetails/UserDetailsMini';

import { NftsList } from './BlockchainData/NftsList';
import { OrgsList } from './BlockchainData/OrgsList';
import { PoapsList } from './BlockchainData/PoapsList';

function MemberProfile({ title, member, onClose }: { title?: string; member: Member; onClose: VoidFunction }) {
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
    charmClient.getUserByPath(member.path ?? member.id)
  );
  if (!currentSpace || !currentUser) {
    return null;
  }

  if (member.id === currentUser.id) {
    return (
      <MemberPropertiesPopup
        title={title && title.length !== 0 ? title : 'Edit your profile'}
        onClose={() => onClose()}
        isLoading={isFetchingUser}
        memberId={currentUser.id}
        spaceId={currentSpace.id}
        updateMemberPropertyValues={updateSpaceValues}
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
          <>
            <UserDetails
              sx={{
                mt: 0
              }}
              // currentUser doesn't have profile thus is not considered as publicUser inside UserDetails
              // giving the ability to update the profile properties
              user={user.id === currentUser.id ? currentUser : user}
              updateUser={setUser}
            />
            <MemberEmailForm />
          </>
        )}
        <Legend mt={4}>Member details</Legend>
      </MemberPropertiesPopup>
    );
  }

  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen}>
      {isFetchingUser || !user || member.id !== user.id ? (
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
            <UserDetailsMini user={user} readOnly />
            <Legend mt={4}>Member details</Legend>
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
  title
}: {
  title?: string;
  memberId: string;
  onClose: VoidFunction;
}) {
  const { members } = useMembers();
  const member = members.find((_member) => _member.id === memberId);

  if (!member) {
    return null;
  }

  return <MemberProfile title={title} member={member} onClose={onClose} />;
}
