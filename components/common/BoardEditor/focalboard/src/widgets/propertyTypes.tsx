import { Divider, ListItemIcon, MenuItem, Typography, Stack } from '@mui/material';
import { useIntl } from 'react-intl';

import type { PropertyType } from 'lib/focalboard/board';
import { proposalPropertyTypesList, propertyTypesList } from 'lib/focalboard/board';

import { iconForPropertyType } from '../components/viewHeader/viewHeaderPropertiesMenu';

import { typeDisplayName } from './typeDisplayName';

export function PropertyTypes({ onClick, isMobile }: { onClick: (type: PropertyType) => void; isMobile?: boolean }) {
  const intl = useIntl();
  return (
    <Stack gap={isMobile ? 0 : 0.5}>
      {!isMobile && (
        <>
          <Typography px={1} color='secondary' variant='subtitle1'>
            Select property type
          </Typography>
          <Divider />
        </>
      )}
      {propertyTypesList
        .filter((type) => !proposalPropertyTypesList.includes(type as any))
        .map((type) => (
          <MenuItem data-test={`select-property-${type}`} onClick={() => onClick(type)} key={type}>
            <ListItemIcon>{iconForPropertyType(type)}</ListItemIcon>
            <Typography>{typeDisplayName(intl, type)}</Typography>
          </MenuItem>
        ))}
    </Stack>
  );
}
