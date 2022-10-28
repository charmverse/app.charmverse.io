import { InputLabel, MenuItem, Select, Stack } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';

import { useMemberProperties } from 'hooks/useMemberProperties';

export function MemberDirectorySort ({
  setSortedProperty,
  sortedProperty
}: {
  sortedProperty: string | null;
  setSortedProperty: Dispatch<SetStateAction<string | null>>;
}) {
  const { properties = [] } = useMemberProperties();
  return (
    <Stack flexDirection='row' alignItems='center' gap={1}>
      <InputLabel>Sort</InputLabel>
      <Select
        variant='outlined'
        value={sortedProperty}
        onChange={(e) => {
          setSortedProperty(e.target.value);
        }}
      >
        {
          properties.filter(property => !property.type.match(/role|profile_pic/)).sort((propA, propB) => propA.name > propB.name ? -1 : 1)
            .map(property => <MenuItem key={property.name} value={property.name}>{property.name}</MenuItem>)
        }
      </Select>
    </Stack>
  );
}
