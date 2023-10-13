import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { IconButton, ListItemIcon, ListItemText, MenuItem, Typography, Stack } from '@mui/material';
import { useMemo } from 'react';

import { Button } from 'components/common/Button';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';

import { Constants } from '../../constants';
import { useSortable } from '../../hooks/sortable';
import mutator from '../../mutator';
import { iconForPropertyType } from '../viewHeader/viewHeaderPropertiesMenu';

interface LayoutOptionsProps {
  properties: readonly IPropertyTemplate[];
  view: BoardView;
}

function PropertyMenuItem({
  isVisible,
  property,
  visibilityToggleDisabled,
  toggleVisibility,
  onDrop
}: {
  property: IPropertyTemplate;
  isVisible: boolean;
  toggleVisibility: (propertyId: string) => void;
  visibilityToggleDisabled?: boolean;
  onDrop: (template: IPropertyTemplate, container: IPropertyTemplate) => void;
}) {
  const [isDragging, isOver, columnRef] = useSortable('column', property, true, onDrop);

  return (
    <Stack
      ref={columnRef}
      sx={{
        minWidth: 250,
        overflow: 'unset',
        opacity: isDragging ? 0.5 : 1,
        transition: `background-color 150ms ease-in-out`,
        backgroundColor: isOver ? 'var(--charmeditor-active)' : 'initial',
        flexDirection: 'row'
      }}
    >
      <MenuItem dense className={isOver ? 'dragover' : ''} sx={{ width: '100%' }}>
        <DragIndicatorIcon color='secondary' fontSize='small' sx={{ mr: 1 }} />
        <ListItemIcon>{iconForPropertyType(property.type)}</ListItemIcon>
        <ListItemText>{property.name}</ListItemText>
        <IconButton
          disabled={visibilityToggleDisabled}
          size='small'
          onClick={() => {
            toggleVisibility(property.id);
          }}
        >
          {isVisible ? <VisibilityIcon fontSize='small' /> : <VisibilityOffIcon fontSize='small' color='secondary' />}
        </IconButton>
      </MenuItem>
    </Stack>
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

    const _visibleProperties = visiblePropertyIds
      .map((visiblePropertyId) => _propertiesRecord[visiblePropertyId])
      // Hot fix - not sure why these dont always exist, maybe the property was deleted?
      .filter(Boolean);

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

  const onDrop = async (sourceProperty: IPropertyTemplate, destinationProperty: IPropertyTemplate) => {
    const isDestinationPropertyVisible = visiblePropertyIds.includes(destinationProperty.id);
    const isSourcePropertyVisible = visiblePropertyIds.includes(sourceProperty.id);

    if (!isDestinationPropertyVisible) {
      mutator.changeViewVisibleProperties(
        view.id,
        visiblePropertyIds,
        visiblePropertyIds.filter((visiblePropertyId) => visiblePropertyId !== sourceProperty.id)
      );
    } else {
      const destIndex = visiblePropertyIds.indexOf(destinationProperty.id);
      const srcIndex = visiblePropertyIds.indexOf(sourceProperty.id);
      const oldPropertyIds = [...visiblePropertyIds];

      if (isSourcePropertyVisible) {
        visiblePropertyIds.splice(destIndex, 0, visiblePropertyIds.splice(srcIndex, 1)[0]);
      } else {
        visiblePropertyIds.splice(destIndex, 0, sourceProperty.id);
      }
      mutator.changeViewVisibleProperties(view.id, oldPropertyIds, visiblePropertyIds);
    }
  };

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
    mutator.changeViewVisibleProperties(view.id, visiblePropertyIds, []);
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
            <Typography variant='subtitle2'>Shown in {view.fields.viewType}</Typography>
            <Button size='small' variant='text' onClick={hideAllProperties}>
              <Typography color='primary' variant='subtitle1'>
                Hide all
              </Typography>
            </Button>
          </Stack>
          <Stack>
            {visibleProperties.map((property) => (
              <PropertyMenuItem
                onDrop={onDrop}
                isVisible
                property={property}
                toggleVisibility={toggleVisibility}
                key={property.id}
              />
            ))}
          </Stack>
        </Stack>
      ) : null}

      {Object.keys(hiddenProperties).length ? (
        <Stack gap={0.5}>
          <Stack alignItems='center' ml={2} mr={1} justifyContent='space-between' flexDirection='row'>
            <Typography variant='subtitle2'>Hidden in {view.fields.viewType}</Typography>
            <Button size='small' variant='text' onClick={showAllProperties}>
              <Typography color='primary' variant='subtitle1'>
                Show all
              </Typography>
            </Button>
          </Stack>
          <Stack>
            {hiddenProperties.map((property) => (
              <PropertyMenuItem
                onDrop={onDrop}
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
