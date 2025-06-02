import { useTheme, styled, Box, useMediaQuery } from '@mui/material';
import type { UpdateMemberPropertyValuePayload } from '@packages/lib/members/interfaces';
import type { FormFieldValue } from '@packages/lib/proposals/forms/interfaces';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { PageEditorContainer } from 'components/[pageId]/DocumentPage/components/PageEditorContainer';
import { Button } from 'components/common/Button';
import Dialog from 'components/common/DatabaseEditor/components/dialog';
import ScrollableWindow from 'components/common/PageLayout/components/ScrollableWindow';
import { useRequiredMemberPropertiesForm } from 'components/members/hooks/useRequiredMemberProperties';
import Legend from 'components/settings/components/Legend';

import { useMemberPropertyValues } from '../../../../../../hooks/useMemberPropertyValues';

import { MemberPropertiesForm } from './MemberPropertiesForm';

type Props = {
  userId: string;
  onClose: VoidFunction;
};

const ContentContainer = styled(PageEditorContainer)`
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
  footerActions,
  'data-test': dataTest
}: {
  onClose?: VoidFunction;
  title: string;
  children?: ReactNode;
  fluidSize?: boolean;
  hideCloseButton?: boolean;
  footerActions?: React.ReactNode;
  'data-test'?: string;
}) {
  const theme = useTheme();
  const fullWidth = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <StyledDialog
      data-test={dataTest}
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

export function MemberPropertiesFormDialog({ userId, onClose }: Props) {
  const { refreshPropertyValues } = useMemberPropertyValues(userId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, isValid, isDirty, onSubmit, onFormChange } = useRequiredMemberPropertiesForm({
    userId
  });

  async function saveForm() {
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
    onClose();
  }

  function onMemberDetailsChange(fields: UpdateMemberPropertyValuePayload[]) {
    onFormChange(fields.map((field) => ({ id: field.memberPropertyId, value: field.value as FormFieldValue })));
  }

  return (
    <DialogContainer title='Edit profile' onClose={onClose}>
      <MemberPropertiesForm
        control={control}
        userId={userId}
        refreshPropertyValues={refreshPropertyValues}
        onChange={onMemberDetailsChange}
      />
      <Box display='flex' justifyContent='flex-end' mt={2} gap={2}>
        <Button disableElevation color='secondary' variant='outlined' onClick={onClose}>
          Cancel
        </Button>
        <Button
          disableElevation
          disabledTooltip={
            !isValid ? 'Please fill out all required fields' : !isDirty ? 'No changes to save' : undefined
          }
          disabled={!isDirty || !isValid}
          loading={isSubmitting}
          onClick={saveForm}
        >
          Save
        </Button>
      </Box>
    </DialogContainer>
  );
}
