import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { IconButton, ListItemIcon, ListItemText, MenuItem, Stack, Typography } from '@mui/material';
import type { IPropertyTemplate } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';
import { Constants } from '@packages/databases/constants';
import mutator from '@packages/databases/mutator';
import { useMemo } from 'react';

import { Button } from 'components/common/Button';

import { useSortable } from '../../hooks/sortable';
import { iconForPropertyType } from '../../widgets/iconForPropertyType';

interface LayoutOptionsProps {
  properties: readonly IPropertyTemplate[];
  view: BoardView;
  setSelectedProperty: (property: IPropertyTemplate) => void;
}

const titleProperty: IPropertyTemplate = {
  id: Constants.titleColumnId,
  name: 'Title',
  options: [],
  type: 'text'
};

function PropertyMenuItem({
  isVisible,
  property,
  visibilityToggleDisabled,
  toggleVisibility,
  onDrop,
  onClick
}: {
  onClick?: VoidFunction;
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
      onClick={onClick}
    >
      <MenuItem dense className={isOver ? 'dragover' : ''} sx={{ width: '100%' }}>
        <DragIndicatorIcon color='secondary' fontSize='small' sx={{ mr: 1 }} />
        <ListItemIcon>{iconForPropertyType(property.type)}</ListItemIcon>
        <ListItemText
          sx={{
            '& .MuiTypography-root': {
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }
          }}
        >
          {property.name}
        </ListItemText>
        <IconButton
          disabled={visibilityToggleDisabled}
          size='small'
          onClick={(e) => {
            e.stopPropagation();
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
  const { properties, view, setSelectedProperty } = props;

  const { visiblePropertyIds } = view.fields;
  const titlePropertyIndex = visiblePropertyIds.indexOf(Constants.titleColumnId);
  const visiblePropertyIdsWithTitle = useMemo(
    () => (titlePropertyIndex === -1 ? [Constants.titleColumnId, ...visiblePropertyIds] : visiblePropertyIds),
    [titlePropertyIndex, visiblePropertyIds]
  );

  const propertiesWithTitle = properties.find((property) => property.id === Constants.titleColumnId)
    ? properties
    : [titleProperty, ...properties];

  const { hiddenProperties, visibleProperties } = useMemo(() => {
    const propertyIds = properties.map((property) => property.id);
    const _propertiesRecord = properties.reduce<Record<string, IPropertyTemplate>>((__propertiesRecord, property) => {
      __propertiesRecord[property.id] = property;
      return __propertiesRecord;
    }, {});

    const _visibleProperties = visiblePropertyIdsWithTitle
      .map((visiblePropertyId) => _propertiesRecord[visiblePropertyId])
      // Hot fix - not sure why these dont always exist, maybe the property was deleted?
      .filter(Boolean);

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

  const onDrop = async (sourceProperty: IPropertyTemplate, destinationProperty: IPropertyTemplate) => {
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
      propertiesWithTitle.map((property) => property.id)
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
                visibilityToggleDisabled={property.id === Constants.titleColumnId}
                isVisible
                onClick={() => setSelectedProperty(property)}
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
                onClick={() => setSelectedProperty(property)}
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
