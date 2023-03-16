import { useTheme } from '@emotion/react';
import { Box, Dialog, DialogContent, Divider, Stack, useMediaQuery } from '@mui/material';
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
import type { MemberPropertyValueType, UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';
import debounce from 'lib/utilities/debounce';

import { NftsList } from '../../MemberMiniProfile/BlockchainData/NftsList';
import { OrgsList } from '../../MemberMiniProfile/BlockchainData/OrgsList';
import { PoapsList } from '../../MemberMiniProfile/BlockchainData/PoapsList';

type Props = {
  updateMemberPropertyValues: (spaceId: string, values: UpdateMemberPropertyValuePayload[]) => Promise<void>;
  showBlockchainData?: boolean;
  spaceId: string;
  memberId: string;
};

export function MemberProperties({ spaceId, updateMemberPropertyValues, showBlockchainData = false, memberId }: Props) {
  const { data: properties = [], mutate } = useSWR(
    spaceId ? `members/${memberId}/values/${spaceId}` : null,
    () => charmClient.members.getSpacePropertyValues(memberId, spaceId || ''),
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
          <NftsList memberId={memberId} />
          <OrgsList memberId={memberId} />
          <PoapsList memberId={memberId} />
        </Stack>
      )}
    </Box>
  );
}

export function MemberPropertiesPopup({
  children,
  memberId,
  spaceId,
  onClose,
  title,
  isLoading = false
}: {
  spaceId: string | null;
  memberId: string;
  onClose: VoidFunction;
  title: string;
  children?: ReactNode;
  isLoading?: boolean;
}) {
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

  function onClickClose() {
    // refresh members only after all the editing is finished
    onClose();
    mutateMembers();
    mutate();
  }

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
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
