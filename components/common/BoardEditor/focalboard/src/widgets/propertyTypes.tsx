import { Divider, ListItemIcon, MenuItem, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { useIntl } from 'react-intl';

import type { PropertyType } from 'lib/focalboard/board';

import { iconForPropertyType } from '../components/viewHeader/viewHeaderPropertiesMenu';

import { propertyTypesList, typeDisplayName } from './propertyMenu';

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
      {propertyTypesList.map((type) => (
        <MenuItem onClick={() => onClick(type)} key={type}>
          <ListItemIcon>{iconForPropertyType(type)}</ListItemIcon>
          <Typography>{typeDisplayName(intl, type)}</Typography>
        </MenuItem>
      ))}
    </Stack>
  );
}
