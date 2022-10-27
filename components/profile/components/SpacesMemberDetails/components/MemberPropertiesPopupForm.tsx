import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Typography } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { getFieldRendererConfig } from 'components/common/form/fields/getFieldRendererConfig';
import LoadingComponent from 'components/common/LoadingComponent';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { MemberPropertyValueType, UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';

import UserDetails from '../../UserDetails';

type Props = {
  spaceId: string | null;
  memberId: string;
  updateMemberPropertyValues: (spaceId: string, values: UpdateMemberPropertyValuePayload[]) => Promise<void>;
  onClose: VoidFunction;
  title?: string;
  showUserDetailsForm?: boolean;
  cancelButtonText?: string;
  spaceName: string;
};

export function MemberPropertiesPopupForm ({ cancelButtonText = 'Cancel', showUserDetailsForm = false, memberId, spaceId, spaceName, updateMemberPropertyValues, onClose, title = 'Edit workspace profile' }: Props) {
  const { data } = useSWR(
    spaceId ? `members/${memberId}/values/${spaceId}` : null,
    () => charmClient.members.getSpacePropertyValues(memberId, spaceId || ''),
    { revalidateOnMount: true }
  );
  const { showMessage } = useSnackbar();
  const { setUser, user } = useUser();

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
    <Dialog open={!!spaceId} onClose={onClose} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        {showUserDetailsForm && user && (
          <>
            <UserDetails
              sx={{
                mt: 0
              }}
              user={user}
              updateUser={setUser}
            />
            <Divider sx={{
              my: 1
            }}
            />
          </>
        )}
        <Typography fontWeight={600}>{spaceName} Member details</Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
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
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant='text' color='secondary' sx={{ px: 4 }}>{cancelButtonText}</Button>
        <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} loading={isSubmitting} sx={{ px: 4 }}>Save</Button>
      </DialogActions>
    </Dialog>
  );

}
