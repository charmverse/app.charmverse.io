import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Box, useMediaQuery } from '@mui/material';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import { Button } from 'components/common/Button';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import Legend from 'components/settings/Legend';
import { useMembers } from 'hooks/useMembers';
import type { UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';

import { useMemberPropertyValues } from '../../../../../../hooks/useMemberPropertyValues';

import { MemberPropertiesForm } from './MemberPropertiesForm';

type Props = {
  spaceId: string;
  userId: string;
  onClose: VoidFunction;
};

const ContentContainer = styled(Container)`
  width: 100%;
  margin-bottom: 100px;
`;

const StyledDialog = styled(Dialog)<{ fluidSize?: boolean }>`
  ${(props) =>
    props.fluidSize
      ? `.dialog {
          width: auto;
          height: auto;
        }`
      : ''}
`;

export function DialogContainer({
  children,
  onClose,
  title,
  fluidSize
}: {
  onClose: VoidFunction;
  title: string;
  children?: ReactNode;
  fluidSize?: boolean;
}) {
  const theme = useTheme();
  const fullWidth = useMediaQuery(theme.breakpoints.down('md'));
  const { mutateMembers } = useMembers();

  function onClickClose() {
    // refresh members only after all the editing is finished
    onClose();
    mutateMembers();
  }

  return (
    <StyledDialog toolbar={<div />} fluidSize={fluidSize} onClose={onClickClose}>
      <ScrollableWindow>
        <ContentContainer fullWidth={fullWidth} top={20}>
          {title && <Legend wrap>{title}</Legend>}
          {children}
        </ContentContainer>
      </ScrollableWindow>
    </StyledDialog>
  );
}

export function MemberPropertiesFormDialog({ spaceId, userId, onClose }: Props) {
  const { memberPropertyValues, updateSpaceValues, refreshPropertyValues } = useMemberPropertyValues(userId);
  const [memberDetails, setMemberDetails] = useState<UpdateMemberPropertyValuePayload[]>([]);

  async function saveForm() {
    await updateSpaceValues(spaceId, memberDetails);
    onClose();
  }

  function onMemberDetailsChange(fields: UpdateMemberPropertyValuePayload[]) {
    setMemberDetails(fields);
  }

  const memberProperties = useMemo(
    () =>
      memberPropertyValues
        ?.filter((mpv) => mpv.spaceId === spaceId)
        .map((mpv) => mpv.properties)
        .flat(),
    [memberPropertyValues, spaceId]
  );

  const isFormClean = memberDetails.length === 0;
  return (
    <DialogContainer title='Edit profile' onClose={onClose}>
      <MemberPropertiesForm
        properties={memberProperties}
        userId={userId}
        refreshPropertyValues={refreshPropertyValues}
        onChange={onMemberDetailsChange}
      />
      <Box display='flex' justifyContent='flex-end' mt={2} gap={2}>
        <Button disableElevation color='secondary' variant='outlined' onClick={onClose}>
          Cancel
        </Button>
        <Button disableElevation disabled={isFormClean} onClick={saveForm}>
          Save
        </Button>
      </Box>
    </DialogContainer>
  );
}
