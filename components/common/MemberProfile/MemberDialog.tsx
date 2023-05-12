import styled from '@emotion/styled';
import OpenInFullIcon from '@mui/icons-material/Launch';
import { Box, DialogContent, Divider, Grid, Stack, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import Legend from 'components/settings/Legend';
import UserDetails from 'components/u/components/UserDetails/UserDetails';
import UserDetailsMini from 'components/u/components/UserDetails/UserDetailsMini';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type { Member } from 'lib/members/interfaces';
import type { LoggedInUser } from 'models';

import { MemberProperties } from './components/MemberProperties';
import { MemberPropertiesDialog } from './components/MemberPropertiesDialog';
import { MemberPropertiesForm } from './components/MemberPropertiesForm';
import { NftsList } from './components/NftsList';
import { OnboardingEmailForm } from './components/OnboardingEmailForm';
import { OrgsList } from './components/OrgsList';
import { PoapsList } from './components/PoapsList';
import { useMemberPropertyValues } from './hooks/useMemberPropertyValues';

type Step = 'email_step' | 'profile_step';

const ContentContainer = styled(Container)`
  width: 100%;
  margin-bottom: 0;
`;

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
    <MemberPropertiesDialog memberId={currentUser.id} onClose={onClose} spaceId={currentSpace.id} title={customTitle}>
      {currentStep === 'email_step' ? (
        <OnboardingEmailForm onClick={goNextStep} />
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
          <MemberPropertiesForm
            memberId={currentUser.id}
            spaceId={currentSpace.id}
            updateMemberPropertyValues={updateSpaceValues}
            showBlockchainData
          />
        </>
      ) : null}
    </MemberPropertiesDialog>
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
  const fullWidth = useMediaQuery(theme.breakpoints.down('md'));
  const { user: currentUser } = useUser();
  const currentSpace = useCurrentSpace();

  const { memberPropertyValues = [] } = useMemberPropertyValues(member.id);
  const currentSpacePropertyValues = memberPropertyValues.find(
    (memberPropertyValue) => memberPropertyValue.spaceId === currentSpace?.id
  );

  const { data: user, isLoading: isFetchingUser } = useSWR(`users/${member.id}`, () =>
    charmClient.getUserByPath(member.id)
  );

  if (!currentSpace || !currentUser) {
    return null;
  }

  if (member.id === currentUser.id) {
    return (
      <CurrentMemberProfile isOnboarding={isOnboarding} currentUser={currentUser} onClose={onClose} title={title} />
    );
  }

  const isLoading = isFetchingUser || !user || member.id !== user.id;

  return (
    <Dialog
      onClose={onClose}
      fullWidth={fullWidth}
      toolbar={
        !isLoading && (
          <Button
            size='small'
            color='secondary'
            href={`/u/${user?.path}`}
            onClick={onClose}
            variant='text'
            target='_blank'
            startIcon={<OpenInFullIcon fontSize='small' />}
          >
            View full profile
          </Button>
        )
      }
    >
      {isLoading ? (
        <DialogContent>
          <LoadingComponent isLoading />
        </DialogContent>
      ) : (
        <ContentContainer top={20}>
          <UserDetailsMini user={user} readOnly />
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Legend mt={4} mb={3}>
                {currentSpace?.name} details
              </Legend>
              <MemberProperties properties={currentSpacePropertyValues?.properties ?? []} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Legend mt={4} mb={3}>
                  &nbsp;
                </Legend>
              </Box>
              <Stack gap={3}>
                <Divider sx={{ display: { xs: 'block', md: 'none' } }} />
                <NftsList memberId={user.id} readOnly />
                <OrgsList memberId={user.id} readOnly />
                <PoapsList memberId={user.id} />
              </Stack>
            </Grid>
          </Grid>
        </ContentContainer>
      )}
    </Dialog>
  );
}

export function MemberDialog({
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
  const { getMemberById } = useMembers();
  const member = getMemberById(memberId);

  if (!member) {
    return null;
  }

  return <MemberProfile isOnboarding={isOnboarding} title={title} member={member} onClose={onClose} />;
}
