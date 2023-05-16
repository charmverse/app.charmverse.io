import { Box, Divider, Stack } from '@mui/material';
import { useCallback, useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { FieldTypeRenderer } from 'components/common/form/fields/FieldTypeRenderer';
import { getFieldTypeRules } from 'components/common/form/fields/util';
import type { MemberPropertyValueType, UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';
import debounce from 'lib/utilities/debounce';

import { useMutateMemberPropertyValues } from '../hooks/useMutateMemberPropertyValues';

import { NftsList } from './NftsList';
import { OrgsList } from './OrgsList';
import { PoapsList } from './PoapsList';

type Props = {
  updateMemberPropertyValues: (spaceId: string, values: UpdateMemberPropertyValuePayload[]) => Promise<void>;
  showBlockchainData?: boolean;
  spaceId: string;
  userId: string;
};

export function MemberPropertiesForm({
  spaceId,
  updateMemberPropertyValues,
  showBlockchainData = false,
  userId
}: Props) {
  const { data: properties = [], mutate } = useSWR(
    spaceId ? `members/${userId}/values/${spaceId}` : null,
    () => charmClient.members.getSpacePropertyValues(userId, spaceId || ''),
    { revalidateOnMount: true }
  );
  const { createOption, deleteOption, updateOption } = useMutateMemberPropertyValues(mutate);

  const defaultValues = useMemo(
    () =>
      properties?.reduce<Record<string, MemberPropertyValueType>>((acc, prop) => {
        acc[prop.memberPropertyId] = prop.value;
        return acc;
      }, {}),
    [properties]
  );

  const {
    control,
    formState: { errors, isDirty },
    reset,
    getValues
  } = useForm({ mode: 'onChange' });

  const onSubmit = useCallback(
    async (submitData: any) => {
      if (!spaceId) {
        return;
      }

      const updateData: UpdateMemberPropertyValuePayload[] = Object.keys(submitData).map((key) => ({
        memberPropertyId: key,
        value: submitData[key]
      }));

      await updateMemberPropertyValues(spaceId, updateData);
    },
    [spaceId]
  );

  const handleOnChange = useCallback(
    debounce(async (propertyId: string, option: any) => {
      await onSubmit({ ...getValues(), [propertyId]: option });
    }, 300),
    [onSubmit]
  );

  useEffect(() => {
    if (defaultValues && isDirty) {
      return;
    }

    reset(defaultValues);
  }, [defaultValues, isDirty]);

  return (
    <Box>
      <Box display='flex' flexDirection='column'>
        {properties.map((property) => (
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
                  handleOnChange(property.memberPropertyId, typeof e?.target?.value === 'string' ? e.target.value : e);
                }}
              />
            )}
          />
        ))}
      </Box>
      {showBlockchainData && (
        <Stack gap={3}>
          <Divider
            sx={{
              mt: 3
            }}
          />
          <NftsList userId={userId} />
          <OrgsList userId={userId} />
          <PoapsList userId={userId} />
        </Stack>
      )}
    </Box>
  );
}
