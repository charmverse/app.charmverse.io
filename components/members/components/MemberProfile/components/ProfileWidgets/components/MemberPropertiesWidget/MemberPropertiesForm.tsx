import { Box, Divider, Stack } from '@mui/material';
import type { Control, FieldErrors, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { FieldTypeRenderer } from 'components/common/form/fields/FieldTypeRenderer';
import { getFieldTypeRules } from 'components/common/form/fields/util';
import { useRequiredMemberProperties } from 'components/members/hooks/useRequiredMemberProperties';
import { useMembers } from 'hooks/useMembers';
import type { UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';

import { useMemberCollections } from '../../../../../../hooks/useMemberCollections';
import { useMutateMemberPropertyValues } from '../../../../../../hooks/useMutateMemberPropertyValues';
import { NftsList } from '../CollectionWidget/NftsList';
import { PoapsList } from '../CollectionWidget/PoapsList';

type Props = {
  onChange: (values: UpdateMemberPropertyValuePayload[]) => void;
  showCollectionOptions?: boolean;
  userId: string;
  refreshPropertyValues: VoidFunction;
  values: FieldValues;
  errors: FieldErrors<FieldValues>;
  control: Control<FieldValues, any>;
};

export function MemberPropertiesForm({
  onChange,
  userId,
  refreshPropertyValues,
  showCollectionOptions,
  values,
  errors,
  control
}: Props) {
  const { membersRecord } = useMembers();
  const { createOption, deleteOption, updateOption } = useMutateMemberPropertyValues(refreshPropertyValues);
  const { memberProperties } = useRequiredMemberProperties({
    userId
  });
  const { isFetchingNfts, isFetchingPoaps, mutateNfts, nfts, nftsError, poaps, poapsError } = useMemberCollections({
    memberId: userId
  });
  function handleOnChange(propertyId: string, option: any) {
    const submitData = { ...values, [propertyId]: option };
    const updateData: UpdateMemberPropertyValuePayload[] = Object.keys(submitData).map((key) => ({
      memberPropertyId: key,
      value: submitData[key]
    }));

    onChange(updateData);
  }

  function getPlaceholder(type: string) {
    if (type === 'name') {
      return membersRecord[userId]?.username;
    }
    return undefined;
  }

  return (
    <Box>
      <Box display='flex' flexDirection='column'>
        {memberProperties?.map((property) => (
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
                placeholder={getPlaceholder(property.type)}
                error={errors[property.memberPropertyId] as any}
                onCreateOption={(option) => createOption(property, option)}
                onUpdateOption={(option) => updateOption(property, option)}
                onDeleteOption={(option) => deleteOption(property, option)}
                required={property.required}
                onChange={(e) => {
                  field.onChange(e);
                  handleOnChange(property.memberPropertyId, typeof e?.target?.value === 'string' ? e.target.value : e);
                }}
              />
            )}
          />
        ))}
      </Box>
      {showCollectionOptions && (
        <Stack gap={3}>
          <Divider
            sx={{
              mt: 3
            }}
          />
          <NftsList
            isFetchingNfts={isFetchingNfts}
            nfts={nfts}
            nftsError={nftsError}
            mutateNfts={mutateNfts}
            userId={userId}
          />
          <PoapsList isFetchingPoaps={isFetchingPoaps} poaps={poaps} poapsError={poapsError} />
        </Stack>
      )}
    </Box>
  );
}
