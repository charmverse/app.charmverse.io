import { useTheme } from '@emotion/react';
import { Box, Dialog, DialogContent, useMediaQuery } from '@mui/material';
import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { getFieldRendererConfig } from 'components/common/form/fields/getFieldRendererConfig';
import LoadingComponent from 'components/common/LoadingComponent';
import { DialogTitle } from 'components/common/Modal';
import { useMutateMemberPropertyValues } from 'components/profile/components/SpacesMemberDetails/components/useMutateMemberPropertyValues';
import { useMembers } from 'hooks/useMembers';
import type {
  MemberPropertyValueType,
  PropertyValueWithDetails,
  UpdateMemberPropertyValuePayload
} from 'lib/members/interfaces';

type Props = {
  spaceId: string | null;
  memberId: string;
  updateMemberPropertyValues: (spaceId: string, values: UpdateMemberPropertyValuePayload[]) => Promise<void>;
  onClose: VoidFunction;
  title?: string;
  children?: ReactNode;
  isLoading?: boolean;
  postComponent?: ReactNode;
};

export function MemberPropertiesPopup({
  children,
  memberId,
  spaceId,
  updateMemberPropertyValues,
  onClose,
  title = 'Edit space profile',
  isLoading = false,
  postComponent = null
}: Props) {
  const {
    data,
    mutate,
    isLoading: isFetchingSpaceProperties
  } = useSWR(
    spaceId ? `members/${memberId}/values/${spaceId}` : null,
    () => charmClient.members.getSpacePropertyValues(memberId, spaceId || ''),
    { revalidateOnMount: true }
  );

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { mutateMembers } = useMembers();
  const { createOption, deleteOption, updateOption } = useMutateMemberPropertyValues(mutate);

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
    formState: { errors, isDirty },
    reset,
    getValues
  } = useForm({ mode: 'onChange' });

  const onSubmit = async (submitData: any) => {
    if (!spaceId) {
      return;
    }

    const updateData: UpdateMemberPropertyValuePayload[] = Object.keys(submitData).map((key) => ({
      memberPropertyId: key,
      value: submitData[key]
    }));

    await updateMemberPropertyValues(spaceId, updateData);
  };

  const customOnChange = async (property: PropertyValueWithDetails, option: any) => {
    await onSubmit({ ...getValues(), [property.memberPropertyId]: option });
    await mutateMembers();
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
      {!data || isFetchingSpaceProperties || isLoading ? (
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
            <Box display='flex' flexDirection='column'>
              {data.map((property) => {
                const fieldRendererConfig = getFieldRendererConfig({
                  type: property.type,
                  label: property.name,
                  error: errors[property.memberPropertyId] as any,
                  options: property.options,
                  onCreateOption: (option) => createOption(property, option),
                  onUpdateOption: (option) => updateOption(property, option),
                  onDeleteOption: (option) => deleteOption(property, option),
                  customOnChange: (option) => customOnChange(property, option)
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
            {postComponent}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
