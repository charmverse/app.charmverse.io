import { Box, Dialog, DialogContent, Stack, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
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
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type { Member } from 'lib/members/interfaces';
import type { LoggedInUser } from 'models';

import { MemberProperties, MemberPropertiesPopup } from '../SpacesMemberDetails/components/MemberPropertiesPopup';
import UserDetailsMini from '../UserDetails/UserDetailsMini';

import { NftsList } from './BlockchainData/NftsList';
import { OrgsList } from './BlockchainData/OrgsList';
import { PoapsList } from './BlockchainData/PoapsList';

type Step = 'email_step' | 'profile_step';

function CurrentMemberProfile({
  currentUser,
  title = 'Edit your profile',
  onClose,
  isOnboarding = false
}: {
  title?: string;
  onClose: VoidFunction;
  currentUser: LoggedInUser;
  isOnboarding?: boolean;
}) {
  const { setUser } = useUser();
  const currentSpace = useCurrentSpace();
  const { updateSpaceValues } = useMemberPropertyValues(currentUser.id);

  const [currentStep, setCurrentStep] = useState<Step>(isOnboarding ? 'email_step' : 'profile_step');

  function goNextStep() {
    setCurrentStep('profile_step');
  }

  if (!currentSpace) {
    return null;
  }

  let customTitle = title;

  if (isOnboarding) {
    if (currentStep === 'email_step') {
      customTitle = 'Welcome to CharmVerse';
    } else if (currentStep === 'profile_step') {
      customTitle = `Welcome to ${currentSpace.domain}. Set up your profile`;
    }
  }

  return (
    <MemberPropertiesPopup memberId={currentUser.id} onClose={onClose} spaceId={currentSpace.id} title={customTitle}>
      {currentStep === 'email_step' ? (
        <MemberEmailForm onClick={goNextStep} />
      ) : currentStep === 'profile_step' ? (
        <>
          <UserDetails
            sx={{
              mt: 0
            }}
            user={currentUser}
            updateUser={setUser}
          />
          <Legend mt={4}>Member details</Legend>
          <MemberProperties
            memberId={currentUser.id}
            spaceId={currentSpace.id}
            updateMemberPropertyValues={updateSpaceValues}
            showBlockchainData
          />
        </>
      ) : null}
    </MemberPropertiesPopup>
  );
}

function MemberProfile({
  isOnboarding,
  title,
  member,
  onClose
}: {
  isOnboarding?: boolean;
  title?: string;
  member: Member;
  onClose: VoidFunction;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { user: currentUser } = useUser();
  const currentSpace = useCurrentSpace();

  const { memberPropertyValues = [] } = useMemberPropertyValues(member.id);
  const currentSpacePropertyValues = memberPropertyValues.find(
    (memberPropertyValue) => memberPropertyValue.spaceId === currentSpace?.id
  );

  const { data: user, isLoading: isFetchingUser } = useSWR(`users/${member.path}`, () =>
    charmClient.getUserByPath(member.path ?? member.id)
  );
  if (!currentSpace || !currentUser) {
    return null;
  }

  if (member.id === currentUser.id) {
    return (
      <CurrentMemberProfile isOnboarding={isOnboarding} currentUser={currentUser} onClose={onClose} title={title} />
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
              <Typography variant='h6'>{member.username}'s profile</Typography>
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
  title,
  isOnboarding
}: {
  title?: string;
  memberId: string;
  onClose: VoidFunction;
  isOnboarding?: boolean;
}) {
  const { members } = useMembers();
  const member = members.find((_member) => _member.id === memberId);

  if (!member) {
    return null;
  }

  return <MemberProfile isOnboarding={isOnboarding} title={title} member={member} onClose={onClose} />;
}
