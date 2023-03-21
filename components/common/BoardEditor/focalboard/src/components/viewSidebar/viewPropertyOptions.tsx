import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { IconButton, ListItemIcon, ListItemText, MenuItem, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { useMemo } from 'react';

import Button from 'components/common/Button';
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
  const titlePropertyIndex = visiblePropertyIds.indexOf(Constants.titleColumnId);
  const visiblePropertyIdsWithTitle =
    titlePropertyIndex === -1 ? [Constants.titleColumnId, ...visiblePropertyIds] : visiblePropertyIds;

  const { hiddenProperties, visibleProperties } = useMemo(() => {
    const propertyIds = properties.map((property) => property.id);
    const _propertiesRecord = properties.reduce<Record<string, IPropertyTemplate>>((__propertiesRecord, property) => {
      __propertiesRecord[property.id] = property;
      return __propertiesRecord;
    }, {});

    // Manually add __title column as its not present by default
    if (!_propertiesRecord[Constants.titleColumnId]) {
      _propertiesRecord[Constants.titleColumnId] = {
        id: Constants.titleColumnId,
        name: 'Title',
        options: [],
        type: 'text'
      };
    }

    const _visibleProperties = visiblePropertyIdsWithTitle.map(
      (visiblePropertyId) => _propertiesRecord[visiblePropertyId]
    );

    const _hiddenProperties = propertyIds
      .filter((propertyId) => !visiblePropertyIdsWithTitle.includes(propertyId))
      .map((propertyId) => _propertiesRecord[propertyId])
      .sort((p1, p2) => {
        return p1.name > p2.name ? 1 : -1;
      });

    return {
      propertiesRecord: _propertiesRecord,
      visibleProperties: _visibleProperties,
      hiddenProperties: _hiddenProperties
    };
  }, [visiblePropertyIdsWithTitle, properties]);

  const onDropToColumn = async (sourceProperty: IPropertyTemplate, destinationProperty: IPropertyTemplate) => {
    const isDestinationPropertyVisible = visiblePropertyIdsWithTitle.includes(destinationProperty.id);
    const isSourcePropertyVisible = visiblePropertyIdsWithTitle.includes(sourceProperty.id);

    if (!isDestinationPropertyVisible) {
      mutator.changeViewVisibleProperties(
        view.id,
        visiblePropertyIdsWithTitle,
        visiblePropertyIdsWithTitle.filter((visiblePropertyId) => visiblePropertyId !== sourceProperty.id)
      );
    } else {
      const destIndex = visiblePropertyIdsWithTitle.indexOf(destinationProperty.id);
      const srcIndex = visiblePropertyIdsWithTitle.indexOf(sourceProperty.id);
      const oldPropertyIds = [...visiblePropertyIdsWithTitle];

      if (isSourcePropertyVisible) {
        visiblePropertyIdsWithTitle.splice(destIndex, 0, visiblePropertyIdsWithTitle.splice(srcIndex, 1)[0]);
      } else {
        visiblePropertyIdsWithTitle.splice(destIndex, 0, sourceProperty.id);
      }
      mutator.changeViewVisibleProperties(view.id, oldPropertyIds, visiblePropertyIdsWithTitle);
    }
  };

  const toggleVisibility = (propertyId: string) => {
    let newVisiblePropertyIds = [];
    if (visiblePropertyIdsWithTitle.includes(propertyId)) {
      newVisiblePropertyIds = visiblePropertyIdsWithTitle.filter((o: string) => o !== propertyId);
    } else {
      newVisiblePropertyIds = [...visiblePropertyIdsWithTitle, propertyId];
    }
    mutator.changeViewVisibleProperties(view.id, visiblePropertyIdsWithTitle, newVisiblePropertyIds);
  };

  const hideAllProperties = () => {
    mutator.changeViewVisibleProperties(view.id, visiblePropertyIdsWithTitle, [Constants.titleColumnId]);
  };

  const showAllProperties = () => {
    mutator.changeViewVisibleProperties(
      view.id,
      visiblePropertyIdsWithTitle,
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
              <PropertyMenuItem
                onDrop={onDropToColumn}
                visibilityToggleDisabled={property.id === Constants.titleColumnId}
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
                onDrop={onDropToColumn}
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
