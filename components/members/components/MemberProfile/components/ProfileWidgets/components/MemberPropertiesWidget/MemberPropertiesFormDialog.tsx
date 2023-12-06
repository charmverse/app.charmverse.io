import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Box, useMediaQuery } from '@mui/material';
import type { ReactNode } from 'react';

import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
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

const ContentContainer = styled(Container)`
  width: 100%;
  margin-bottom: 100px;
`;

const StyledDialog = styled(Dialog)<{ fluidSize?: boolean }>`
  ${({ theme }) => theme.breakpoints.up('md')} {
    .footer-actions {
      width: 100%;
      padding: 0px 95px;
    }
  }

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
  const { mutateMembers } = useMembers();

  const { control, errors, isValid, setValue, isDirty, getValues } = useRequiredMemberPropertiesForm({
    userId
  });

  async function saveForm() {
    await updateSpaceValues(
      spaceId,
      Object.entries(getValues()).map(([memberPropertyId, value]) => ({ memberPropertyId, value }))
    );
    onClose();
  }

  function onMemberDetailsChange(fields: UpdateMemberPropertyValuePayload[]) {
    fields.forEach((field) => {
      setValue(field.memberPropertyId, field.value);
    });
  }

  function onClickClose() {
    onClose();
    mutateMembers();
  }

  return (
    <DialogContainer title='Edit profile' onClose={onClickClose}>
      <MemberPropertiesForm
        values={getValues()}
        control={control}
        errors={errors}
        userId={userId}
        refreshPropertyValues={refreshPropertyValues}
        onChange={onMemberDetailsChange}
      />
      <Box display='flex' justifyContent='flex-end' mt={2} gap={2}>
        <Button disableElevation color='secondary' variant='outlined' onClick={onClose}>
          Cancel
        </Button>
        <Button disableElevation disabled={!isDirty || !isValid} onClick={saveForm}>
          Save
        </Button>
      </Box>
    </DialogContainer>
  );
}
