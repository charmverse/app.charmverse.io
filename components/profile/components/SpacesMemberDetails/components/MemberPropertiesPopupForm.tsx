import { Box, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { getFieldRendererConfig } from 'components/common/form/fields/getFieldRendererConfig';
import LoadingComponent from 'components/common/LoadingComponent';
import type { UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';

type Props = {
  spaceId: string | null;
  memberId: string;
  updateMemberPropertyValues: (values: UpdateMemberPropertyValuePayload[]) => Promise<void>;
  onCancel: VoidFunction;
};

export function MemberPropertiesPopupForm ({ memberId, spaceId, updateMemberPropertyValues, onCancel }: Props) {
  const { data } = useSWR(
    spaceId ? `members/${memberId}/values/${spaceId}` : null,
    () => charmClient.members.getSpacePropertyValues(memberId, spaceId || ''),
    { revalidateOnMount: true }
  );

  const defaultValues: any = useMemo(() => {
    if (data) {
      return undefined;
    }

    return undefined;
  }, []);

  const { control, handleSubmit, formState: { touchedFields, errors }, reset } = useForm({ defaultValues });
  const onSubmit = (submitData: any) => {
    // console.log('🔥tf', touchedFields);
    // console.log('🔥d', submitData);
  };

  useEffect(() => {
    reset();
  }, [spaceId, data]);

  if (!data && spaceId) {
    return <LoadingComponent isLoading />;
  }

  if (!data) {
    return null;
  }

  return (
    <Dialog open={!!spaceId} onClose={onCancel} fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Edit workspace profile</DialogTitle>
        <DialogContent dividers>
          <Box display='flex' flexDirection='column'>
            {data.map(property => {
              const fieldRendererConfig = getFieldRendererConfig({
                type: property.type,
                label: property.name,
                error: errors[property.memberPropertyId]
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
          <Button onClick={onCancel} variant='text' color='secondary'>Cancel</Button>
          <Button type='submit'>Save</Button>
        </DialogActions>
      </form>
    </Dialog>
  );

}
