import { Box, Divider, Stack } from '@mui/material';
import type { Control, FieldErrors, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { FieldTypeRenderer } from 'components/common/form/fields/FieldTypeRenderer';
import { useRequiredMemberProperties } from 'components/members/hooks/useRequiredMemberProperties';
import { DEFAULT_MEMBER_PROPERTIES } from '@packages/lib/members/constants';
import type { UpdateMemberPropertyValuePayload } from '@packages/lib/members/interfaces';

import { useMemberCollections } from '../../../../../../hooks/useMemberCollections';
import { useMutateMemberPropertyValues } from '../../../../../../hooks/useMutateMemberPropertyValues';
import { NftsList } from '../CollectionWidget/NftsList';
import { PoapsList } from '../CollectionWidget/PoapsList';

type Props = {
  onChange: (values: UpdateMemberPropertyValuePayload[]) => void;
  showCollectionOptions?: boolean;
  userId: string;
  refreshPropertyValues: VoidFunction;
  control: Control<FieldValues, any>;
};

export function MemberPropertiesForm({
  onChange,
  userId,
  refreshPropertyValues,
  showCollectionOptions,
  control
}: Props) {
  const { createOption, deleteOption, updateOption } = useMutateMemberPropertyValues(refreshPropertyValues);
  const { memberProperties } = useRequiredMemberProperties({
    userId
  });
  const { isFetchingNfts, isFetchingPoaps, mutateNfts, nfts, nftsError, poaps, poapsError } = useMemberCollections({
    memberId: userId
  });

  return (
    <Box>
      <Box display='flex' flexDirection='column'>
        {memberProperties
          ?.filter((mp) => !DEFAULT_MEMBER_PROPERTIES.includes(mp.type))
          ?.map((property) => (
            <Controller
              key={property.memberPropertyId}
              name={property.memberPropertyId}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <FieldTypeRenderer
                  {...field}
                  type={property.type}
                  label={property.name}
                  options={property.options}
                  error={error ? error?.message || 'invalid input' : ''}
                  onCreateOption={(option) => createOption(property, option)}
                  onUpdateOption={(option) => updateOption(property, option)}
                  onDeleteOption={(option) => deleteOption(property, option)}
                  required={property.required}
                  onChange={(e) => {
                    field.onChange(e);
                    onChange([
                      {
                        memberPropertyId: property.memberPropertyId,
                        value: typeof e?.target?.value === 'string' ? e.target.value : e
                      }
                    ]);
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
