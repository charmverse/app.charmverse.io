import styled from '@emotion/styled';
import OpenInFullIcon from '@mui/icons-material/Launch';
import { Box, DialogContent, Divider, Grid, Stack, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import Legend from 'components/settings/Legend';
import UserDetailsMini from 'components/u/components/UserDetails/UserDetailsMini';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { Member } from 'lib/members/interfaces';

import { useMemberPropertyValues } from '../hooks/useMemberPropertyValues';

import { MemberProperties } from './MemberProperties';
import { NftsList } from './NftsList';
import { OrgsList } from './OrgsList';
import { PoapsList } from './PoapsList';

const ContentContainer = styled(Container)`
  width: 100%;
  margin-bottom: 0;
`;

export function MemberProfile({
  isOnboarding,
  member,
  onClose
}: {
  isOnboarding?: boolean;
  member: Member;
  onClose: VoidFunction;
}) {
  const theme = useTheme();
  const fullWidth = useMediaQuery(theme.breakpoints.down('md'));
  const currentSpace = useCurrentSpace();

  const { memberPropertyValues = [] } = useMemberPropertyValues(member.id);
  const currentSpacePropertyValues = memberPropertyValues.find(
    (memberPropertyValue) => memberPropertyValue.spaceId === currentSpace?.id
  );

  const { data: user, isLoading: isFetchingUser } = useSWR(`users/${member.id}`, () =>
    charmClient.getUserByPath(member.id)
  );

  if (!currentSpace) {
    return null;
  }

  const isLoading = isFetchingUser || !user || member.id !== user.id;

  if (isLoading && isOnboarding) {
    return null;
  }

  return (
    <Dialog
      onClose={onClose}
      fullWidth={fullWidth}
      toolbar={
        !isLoading && (
          <Button
            size='small'
            color='secondary'
            href={`/u/${member.path || member.id}`}
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
