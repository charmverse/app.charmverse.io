import { Box } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { getFieldRendererConfig } from 'components/common/form/fields/getFieldRendererConfig';
import LoadingComponent from 'components/common/LoadingComponent';
import type { UpdateMemberPropertyValuePayload } from 'lib/members/interfaces';

type Props = {
  spaceId: string | null;
  memberId: string;
  updateMemberPropertyValues: (values: UpdateMemberPropertyValuePayload[]) => Promise<void>;
};

export function MemberPropertiesForm ({ memberId, spaceId, updateMemberPropertyValues }: Props) {
  const { data } = useSWR(
    spaceId ? `members/${memberId}/values/${spaceId}` : null,
    () => charmClient.members.getSpacePropertyValues(memberId, spaceId || ''),
    { revalidateOnMount: true }
  );

  const { control, handleSubmit, formState: { touchedFields, errors } } = useForm();
  const onSubmit = (submitData: any) => {
    // console.log('🔥tf', touchedFields);
    // console.log('🔥d', submitData);
  };

  if (!data && spaceId) {
    return <LoadingComponent isLoading />;
  }

  if (!data) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box>
        {data.map(property => {
          const fieldRendererConfig = getFieldRendererConfig({ type: property.type, label: property.name, error: errors[property.memberPropertyId] });

          return fieldRendererConfig.renderer
            ? (
              <Controller
                name={property.memberPropertyId}
                control={control}
                rules={fieldRendererConfig.rules}
                render={fieldRendererConfig.renderer}
              />
            ) : null;
        })}

        <input type='submit' />
      </Box>

    </form>
  );
}
