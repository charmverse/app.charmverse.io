import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Box, IconButton, ListItemIcon, ListItemText, MenuItem, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { useMemo } from 'react';

import Button from 'components/common/Button';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';

import mutator from '../../mutator';
import { iconForPropertyType } from '../viewHeader/viewHeaderPropertiesMenu';

interface LayoutOptionsProps {
  properties: readonly IPropertyTemplate[];
  view: BoardView;
}

function PropertyMenuItem({
  isVisible,
  property,
  toggleVisibility
}: {
  property: IPropertyTemplate;
  isVisible: boolean;
  toggleVisibility: (propertyId: string) => void;
}) {
  return (
    <MenuItem
      dense
      sx={{
        minWidth: 250
      }}
    >
      <ListItemIcon>{iconForPropertyType(property.type)}</ListItemIcon>
      <ListItemText>{property.name}</ListItemText>
      <IconButton
        size='small'
        onClick={() => {
          toggleVisibility(property.id);
        }}
      >
        {isVisible ? <VisibilityIcon fontSize='small' /> : <VisibilityOffIcon fontSize='small' color='secondary' />}
      </IconButton>
    </MenuItem>
  );
}

function PropertyOptions(props: LayoutOptionsProps) {
  const { properties, view } = props;
  const { visiblePropertyIds } = view.fields;

  const { hiddenProperties, visibleProperties } = useMemo(() => {
    const propertyIds = properties.map((property) => property.id);
    const _propertiesRecord = properties.reduce<Record<string, IPropertyTemplate>>((__propertiesRecord, property) => {
      __propertiesRecord[property.id] = property;
      return __propertiesRecord;
    }, {});

    const _visibleProperties = visiblePropertyIds.map((visiblePropertyId) => _propertiesRecord[visiblePropertyId]);

    const _hiddenProperties = propertyIds
      .filter((propertyId) => !visiblePropertyIds.includes(propertyId))
      .map((propertyId) => _propertiesRecord[propertyId])
      .sort((p1, p2) => {
        return p1.name > p2.name ? 1 : -1;
      });

    return {
      propertiesRecord: _propertiesRecord,
      visibleProperties: _visibleProperties,
      hiddenProperties: _hiddenProperties
    };
  }, [visiblePropertyIds, properties]);

  const toggleVisibility = (propertyId: string) => {
    let newVisiblePropertyIds = [];
    if (visiblePropertyIds.includes(propertyId)) {
      newVisiblePropertyIds = visiblePropertyIds.filter((o: string) => o !== propertyId);
    } else {
      newVisiblePropertyIds = [...visiblePropertyIds, propertyId];
    }
    mutator.changeViewVisibleProperties(view.id, visiblePropertyIds, newVisiblePropertyIds);
  };

  const hideAllProperties = () => {
    mutator.changeViewVisibleProperties(view.id, visiblePropertyIds, ['__title']);
  };

  const showAllProperties = () => {
    mutator.changeViewVisibleProperties(
      view.id,
      visiblePropertyIds,
      properties.map((property) => property.id)
    );
  };

  return (
    <Stack onClick={(e) => e.stopPropagation()} gap={1}>
      {Object.keys(visibleProperties).length ? (
        <Stack gap={0.5}>
          <Stack alignItems='center' ml={2} mr={1} justifyContent='space-between' flexDirection='row'>
            <Typography variant='subtitle2'>Shown in table</Typography>
            <Button size='small' variant='text' onClick={hideAllProperties}>
              <Typography color='primary' variant='subtitle1'>
                Hide all
              </Typography>
            </Button>
          </Stack>
          <Stack>
            {visibleProperties.map((property) => (
              <PropertyMenuItem isVisible property={property} toggleVisibility={toggleVisibility} key={property.id} />
            ))}
          </Stack>
        </Stack>
      ) : null}

      {Object.keys(hiddenProperties).length ? (
        <Stack gap={0.5}>
          <Stack alignItems='center' ml={2} mr={1} justifyContent='space-between' flexDirection='row'>
            <Typography variant='subtitle2'>Hidden in table</Typography>
            <Button size='small' variant='text' onClick={showAllProperties}>
              <Typography color='primary' variant='subtitle1'>
                Show all
              </Typography>
            </Button>
          </Stack>
          <Stack>
            {hiddenProperties.map((property) => (
              <PropertyMenuItem
                isVisible={false}
                property={property}
                toggleVisibility={toggleVisibility}
                key={property.id}
              />
            ))}
          </Stack>
        </Stack>
      ) : null}
    </Stack>
  );
}

export default PropertyOptions;
