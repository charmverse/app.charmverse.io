import { Box, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { getFieldRendererConfig } from 'components/common/form/fields/getFieldRendererConfig';
import LoadingComponent from 'components/common/LoadingComponent';
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

export function MemberPropertiesPopupForm ({ cancelButtonText = 'Cancel', children, memberId, spaceId, updateMemberPropertyValues, onClose, title = 'Edit workspace profile' }: Props) {
  const { data } = useSWR(
    spaceId ? `members/${memberId}/values/${spaceId}` : null,
    () => charmClient.members.getSpacePropertyValues(memberId, spaceId || ''),
    { revalidateOnMount: true }
  );
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

  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm();

  const onSubmit = async (submitData: any) => {
    if (!spaceId) {
      return;
    }

    const updateData: UpdateMemberPropertyValuePayload[] = Object.keys(submitData)
      .map(key => ({ memberPropertyId: key, value: submitData[key] }));

    await updateMemberPropertyValues(spaceId, updateData);
    showMessage('Profile updated successfully', 'success');
    onClose();
  };

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues]);

  return (
    <Dialog open={!!spaceId} onClose={onClose} fullWidth>
      {
        !data ? <DialogContent><LoadingComponent isLoading /></DialogContent> : (
          <>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent dividers>
              {children}
              <form onSubmit={handleSubmit(onSubmit)}>
                <Box display='flex' flexDirection='column'>
                  {data.map(property => {
                    const fieldRendererConfig = getFieldRendererConfig({
                      type: property.type,
                      label: property.name,
                      error: errors[property.memberPropertyId],
                      inline: true,
                      options: property.options
                    });

                    return fieldRendererConfig.renderer
                      ? (
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
                <Button data-test='close-member-properties-modal' onClick={onClose} variant='text' color='secondary' sx={{ px: 4 }}>{cancelButtonText}</Button>
                <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} loading={isSubmitting} sx={{ px: 4 }}>Save</Button>
              </DialogActions>
            </DialogContent>
          </>
        )
      }
    </Dialog>
  );
}
