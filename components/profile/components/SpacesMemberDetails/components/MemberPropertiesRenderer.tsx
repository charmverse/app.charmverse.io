import { Chip, Typography, Stack } from '@mui/material';

import { SelectPreview } from 'components/common/form/fields/Select/SelectPreview';
import { useDateFormatter } from 'hooks/useDateFormatter';
import type { PropertyValueWithDetails } from 'lib/members/interfaces';

export function MemberPropertiesRenderer({ properties }: { properties: PropertyValueWithDetails[] }) {
  const { formatDate } = useDateFormatter();

  return (
    <Stack gap={2}>
      {properties.map((property) => {
        if (!property.enabledViews.includes('profile')) {
          return null;
        }
        switch (property.type) {
          case 'text':
          case 'text_multiline':
          case 'phone':
          case 'name':
          case 'url':
          case 'email':
          case 'number': {
            return (
              property.value && (
                <Stack key={property.memberPropertyId}>
                  <Typography fontWeight='bold'>{property.name}</Typography>
                  <Typography
                    sx={{
                      wordBreak: 'break-word'
                    }}
                    whiteSpace={property.type === 'text_multiline' ? 'pre-wrap' : 'initial'}
                  >
                    {property.value as string}
                  </Typography>
                </Stack>
              )
            );
          }
          case 'multiselect':
          case 'select': {
            const propertyValue = property.value as string | undefined | string[];
            if (!propertyValue || propertyValue?.length === 0) {
              return null;
            }
            return <SelectPreview value={propertyValue} name={property.name} options={property.options} />;
          }
          case 'join_date': {
            return (
              <Stack key={property.memberPropertyId}>
                <Typography fontWeight='bold'>{property.name}</Typography>
                <Typography>{formatDate(property.value as string, { withYear: true })}</Typography>
              </Stack>
            );
          }
          case 'role': {
            const roles = property.value as string[];
            return (
              roles.length !== 0 && (
                <Stack key={property.memberPropertyId}>
                  <Typography fontWeight='bold'>{property.name}</Typography>
                  <Stack gap={1} flexDirection='row' flexWrap='wrap'>
                    {roles.map((role) => (
                      <Chip label={role} key={role} size='small' variant='outlined' />
                    ))}
                  </Stack>
                </Stack>
              )
            );
          }
          default: {
            return null;
          }
        }
      })}
    </Stack>
  );
}
