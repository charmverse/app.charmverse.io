import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Box, useMediaQuery } from '@mui/material';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { PageEditorContainer } from 'components/[pageId]/DocumentPage/components/PageEditorContainer';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import { Button } from 'components/common/Button';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import { useRequiredMemberPropertiesForm } from 'components/members/hooks/useRequiredMemberProperties';
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

const ContentContainer = styled(PageEditorContainer)`
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
  fluidSize,
  hideCloseButton,
  footerActions
}: {
  onClose?: VoidFunction;
  title: string;
  children?: ReactNode;
  fluidSize?: boolean;
  hideCloseButton?: boolean;
  footerActions?: React.ReactNode;
}) {
  const theme = useTheme();
  const fullWidth = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <StyledDialog
      toolbar={<div />}
      fluidSize={fluidSize}
      hideCloseButton={hideCloseButton}
      onClose={onClose}
      footerActions={footerActions}
    >
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
  const { updateSpaceValues, refreshPropertyValues } = useMemberPropertyValues(userId);
  const [memberDetails, setMemberDetails] = useState<UpdateMemberPropertyValuePayload[]>([]);
  const { mutateMembers } = useMembers();

  const { control, errors, isValid, memberProperties, values } = useRequiredMemberPropertiesForm({ userId });

  async function saveForm() {
    await updateSpaceValues(spaceId, memberDetails);
    onClose();
  }

  function onMemberDetailsChange(fields: UpdateMemberPropertyValuePayload[]) {
    setMemberDetails(fields);
  }

  function onClickClose() {
    // refresh members only after all the editing is finished
    onClose();
    mutateMembers();
  }

  const isFormClean = memberDetails.length === 0;
  return (
    <DialogContainer title='Edit profile' onClose={onClickClose}>
      <MemberPropertiesForm
        values={values}
        control={control}
        errors={errors}
        properties={memberProperties}
        userId={userId}
        refreshPropertyValues={refreshPropertyValues}
        onChange={onMemberDetailsChange}
      />
      <Box display='flex' justifyContent='flex-end' mt={2} gap={2}>
        <Button disableElevation color='secondary' variant='outlined' onClick={onClose}>
          Cancel
        </Button>
        <Button disableElevation disabled={isFormClean || !isValid} onClick={saveForm}>
          Save
        </Button>
      </Box>
    </DialogContainer>
  );
}
