import styled from '@emotion/styled';
import OpenInFullIcon from '@mui/icons-material/Launch';
import { Box, Divider, Grid, Stack, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import Button from 'components/common/Button';
import Legend from 'components/settings/Legend';
import { UserDetailsMini } from 'components/u/components/UserDetails/UserDetailsMini';
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
  member,
  space,
  onClose
}: {
  member: Member;
  space?: null | { id: string; name: string };
  onClose: VoidFunction;
}) {
  const theme = useTheme();
  const fullWidth = useMediaQuery(theme.breakpoints.down('md'));

  const { memberPropertyValues = [] } = useMemberPropertyValues(member.id);
  const currentSpacePropertyValues = memberPropertyValues.find(
    (memberPropertyValue) => memberPropertyValue.spaceId === space?.id
  );

  if (!space) {
    return null;
  }

  return (
    <Dialog
      onClose={onClose}
      fullWidth={fullWidth}
      toolbar={
        <Button
          size='small'
          color='secondary'
          href={`/u/${member.path}`}
          variant='text'
          target='_blank'
          startIcon={<OpenInFullIcon fontSize='small' />}
        >
          View full profile
        </Button>
      }
    >
      <ContentContainer top={20}>
        <UserDetailsMini user={member} readOnly />
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Legend mt={4} mb={3}>
              {space?.name} details
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
              <NftsList memberId={member.id} readOnly />
              <OrgsList memberId={member.id} readOnly />
              <PoapsList memberId={member.id} />
            </Stack>
          </Grid>
        </Grid>
      </ContentContainer>
    </Dialog>
  );
}
