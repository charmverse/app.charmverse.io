import { InputLabel, ListItemIcon, MenuItem, Select, Typography } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';

import { StyledViewOptions } from 'components/common/ViewOptions';
import { useMemberProperties } from 'hooks/useMemberProperties';

import { MemberPropertyIcons } from './MemberDirectoryProperties/MemberPropertyItem';

export function MemberDirectorySort ({
  setSortedProperty,
  sortedProperty
}: {
  sortedProperty: string;
  setSortedProperty: Dispatch<SetStateAction<string>>;
}) {
  const { properties = [] } = useMemberProperties();
  const sortableProperties = properties
    .filter(property => !['profile_pic', 'role'].includes(property.type));

  return (
    <StyledViewOptions>
      <InputLabel>Sort</InputLabel>
      <Select
        variant='outlined'
        value={sortedProperty}
        onChange={(e) => {
          setSortedProperty(e.target.value);
        }}
        renderValue={(value) => value}
      >
        {
          sortableProperties
            .sort((propA, propB) => propA.name > propB.name ? 1 : -1)
            .map(property => (
              <MenuItem key={property.name} value={property.name}>
                <ListItemIcon>
                  {MemberPropertyIcons[property.type]}
                </ListItemIcon>
                <Typography>{property.name}</Typography>
              </MenuItem>
            ))
        }
      </Select>
    </StyledViewOptions>
  );
}
