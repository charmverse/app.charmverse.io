import { Box, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
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
  updateMemberPropertyValues: (spsaceId: string, values: UpdateMemberPropertyValuePayload[]) => Promise<void>;
  onClose: VoidFunction;
};

export function MemberPropertiesPopupForm ({ memberId, spaceId, updateMemberPropertyValues, onClose }: Props) {
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

  const { control, handleSubmit, formState: { touchedFields, errors, isSubmitting }, reset } = useForm();

  const onSubmit = async (submitData: any) => {
    if (!spaceId) {
      return;
    }

    const updateData: UpdateMemberPropertyValuePayload[] = Object.keys(touchedFields)
      .map(key => ({ memberPropertyId: key, value: submitData[key] }));

    await updateMemberPropertyValues(spaceId, updateData);
    showMessage('Profile updated successfully', 'success');
    onClose();
  };

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues]);

  if (!data && spaceId) {
    return <LoadingComponent isLoading />;
  }

  if (!data) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Dialog open={!!spaceId} onClose={onClose} fullWidth>
        <DialogTitle>Edit workspace profile</DialogTitle>
        <DialogContent dividers>
          <Box display='flex' flexDirection='column'>
            {data.map(property => {
              const fieldRendererConfig = getFieldRendererConfig({
                type: property.type,
                label: property.name,
                error: errors[property.memberPropertyId],
                inline: true
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
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant='text' color='secondary' sx={{ px: 4 }}>Cancel</Button>
          <Button type='submit' disabled={isSubmitting} loading={isSubmitting} sx={{ px: 4 }}>Save</Button>
        </DialogActions>
      </Dialog>
    </form>
  );

}
