import { useTheme } from '@emotion/react';
import { Box, Dialog, DialogContent, useMediaQuery } from '@mui/material';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { FieldTypeRenderer } from 'components/common/form/fields/FieldTypeRenderer';
import { getFieldTypeRules } from 'components/common/form/fields/util';
import LoadingComponent from 'components/common/LoadingComponent';
import { DialogTitle } from 'components/common/Modal';
import { useMutateMemberPropertyValues } from 'components/profile/components/SpacesMemberDetails/components/useMutateMemberPropertyValues';
import { useMembers } from 'hooks/useMembers';
import type {
  MemberPropertyValueType,
  PropertyValueWithDetails,
  UpdateMemberPropertyValuePayload
} from 'lib/members/interfaces';
import debounce from 'lib/utilities/debounce';

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

  const handleOnChange = useCallback(
    debounce(async (propertyId: string, option: any) => {
      await onSubmit({ ...getValues(), [propertyId]: option });
    }, 300),
    []
  );

  function onClickClose() {
    // refresh members only after all the editing is finished
    mutateMembers();
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
    <Dialog open={!!spaceId} onClose={onClickClose} fullScreen={fullScreen} fullWidth>
      {!data || isFetchingSpaceProperties || isLoading ? (
        <DialogContent>
          <LoadingComponent isLoading />
        </DialogContent>
      ) : (
        <>
          <DialogTitle sx={{ '&&': { px: 2, py: 2 } }} onClose={onClickClose}>
            {title}
          </DialogTitle>
          <DialogContent dividers sx={{ pb: 6 }}>
            {children}
            <Box display='flex' flexDirection='column'>
              {data.map((property) => (
                <Controller
                  key={property.memberPropertyId}
                  name={property.memberPropertyId}
                  control={control}
                  rules={getFieldTypeRules(property.type)}
                  render={({ field }) => (
                    <FieldTypeRenderer
                      {...field}
                      type={property.type}
                      label={property.name}
                      options={property.options}
                      error={errors[property.memberPropertyId] as any}
                      onCreateOption={(option) => createOption(property, option)}
                      onUpdateOption={(option) => updateOption(property, option)}
                      onDeleteOption={(option) => deleteOption(property, option)}
                      onChange={(e) => {
                        field.onChange(e);
                        handleOnChange(property.memberPropertyId, e?.target?.value ? e.target.value : e);
                      }}
                    />
                  )}
                />
              ))}
            </Box>
            {postComponent}
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
