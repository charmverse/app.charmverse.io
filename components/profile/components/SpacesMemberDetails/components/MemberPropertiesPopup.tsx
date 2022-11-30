import { useTheme } from '@emotion/react';
import { Box, Dialog, DialogActions, DialogContent, useMediaQuery } from '@mui/material';
import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { getFieldRendererConfig } from 'components/common/form/fields/getFieldRendererConfig';
import LoadingComponent from 'components/common/LoadingComponent';
import { DialogTitle } from 'components/common/Modal';
import { useMutateMemberPropertyValues } from 'components/profile/components/SpacesMemberDetails/components/useMutateMemberPropertyValues';
import { useSnackbar } from 'hooks/useSnackbar';
import type { MemberPropertyValueType, UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';

type Props = {
  spaceId: string | null;
  memberId: string;
  updateMemberPropertyValues: (spaceId: string, values: UpdateMemberPropertyValuePayload[]) => Promise<void>;
  onClose: VoidFunction;
  title?: string;
  cancelButtonText?: string;
  children?: ReactNode;
};

export function MemberPropertiesPopup({
  cancelButtonText = 'Cancel',
  children,
  memberId,
  spaceId,
  updateMemberPropertyValues,
  onClose,
  title = 'Edit workspace profile'
}: Props) {
  const { data, mutate } = useSWR(
    spaceId ? `members/${memberId}/values/${spaceId}` : null,
    () => charmClient.members.getSpacePropertyValues(memberId, spaceId || ''),
    { revalidateOnMount: true }
  );

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const { createOption, deleteOption, updateOption } = useMutateMemberPropertyValues(mutate);
  const { showMessage } = useSnackbar();

  const defaultValues = useMemo(() => {
    if (data) {
      return data.reduce((acc, prop) => {
        acc[prop.memberPropertyId] = prop.value;
        return acc;
      }, {} as Record<string, MemberPropertyValueType>);
    }

    return undefined;
  }, [data]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset
  } = useForm();

  const onSubmit = async (submitData: any) => {
    if (!spaceId) {
      return;
    }

    const updateData: UpdateMemberPropertyValuePayload[] = Object.keys(submitData).map((key) => ({
      memberPropertyId: key,
      value: submitData[key]
    }));

    await updateMemberPropertyValues(spaceId, updateData);
    showMessage('Profile updated successfully', 'success');
    onClose();
  };

  function onClickClose() {
    reset();
    onClose();
  }

  useEffect(() => {
    if (defaultValues && isDirty) {
      return;
    }

    reset(defaultValues);
  }, [defaultValues, isDirty]);

  return (
    <Dialog open={!!spaceId} onClose={onClose} fullScreen={fullScreen} fullWidth>
      {!data ? (
        <DialogContent>
          <LoadingComponent isLoading />
        </DialogContent>
      ) : (
        <>
          <DialogTitle sx={{ '&&': { px: 2, py: 2 } }} onClose={onClickClose}>
            {title}
          </DialogTitle>
          <DialogContent dividers>
            {children}
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box display='flex' flexDirection='column'>
                {data.map((property) => {
                  const fieldRendererConfig = getFieldRendererConfig({
                    type: property.type,
                    label: property.name,
                    error: errors[property.memberPropertyId],
                    inline: true,
                    options: property.options,
                    onCreateOption: (option) => createOption(property, option),
                    onUpdateOption: (option) => updateOption(property, option),
                    onDeleteOption: (option) => deleteOption(property, option)
                  });

                  return fieldRendererConfig.renderer ? (
                    <Controller
                      key={property.memberPropertyId}
                      name={property.memberPropertyId}
                      control={control}
                      rules={fieldRendererConfig.rules}
                      render={fieldRendererConfig.renderer}
                    />
                  ) : null;
                })}
              </Box>
            </form>
            <DialogActions>
              <Button
                data-test='close-member-properties-modal'
                onClick={onClose}
                variant='text'
                color='secondary'
                sx={{ px: 4 }}
              >
                {cancelButtonText}
              </Button>
              <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} loading={isSubmitting} sx={{ px: 4 }}>
                Save
              </Button>
            </DialogActions>
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
