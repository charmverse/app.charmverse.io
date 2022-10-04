import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Box, IconButton, ListItemIcon, ListItemText, MenuItem } from '@mui/material';

import type { IPropertyTemplate } from '../../blocks/board';
import type { BoardView } from '../../blocks/boardView';
import mutator from '../../mutator';
import { iconForPropertyType } from '../viewHeader/viewHeaderPropertiesMenu';

interface LayoutOptionsProps {
  properties: readonly IPropertyTemplate[];
  view: BoardView;
}

function PropertyOptions (props: LayoutOptionsProps) {

  const { properties, view } = props;
  const { visiblePropertyIds } = view.fields;

  const toggleVisibility = (propertyId: string) => {
    let newVisiblePropertyIds = [];
    if (visiblePropertyIds.includes(propertyId)) {
      newVisiblePropertyIds = visiblePropertyIds.filter((o: string) => o !== propertyId);
    }
    else {
      newVisiblePropertyIds = [...visiblePropertyIds, propertyId];
    }
    mutator.changeViewVisibleProperties(view.id, visiblePropertyIds, newVisiblePropertyIds);
  };

  return (
    <Box onClick={e => e.stopPropagation()}>
      {
        properties.map(property => (
          <MenuItem
            dense
            sx={{
              minWidth: 250
            }}
            key={property.id}
          >
            <ListItemIcon>{iconForPropertyType(property.type)}</ListItemIcon>
            <ListItemText>{property.name}</ListItemText>
            <IconButton
              size='small'
              onClick={() => {
                toggleVisibility(property.id);
              }}
            >
              {visiblePropertyIds.includes(property.id) ? <VisibilityIcon fontSize='small' /> : <VisibilityOffIcon fontSize='small' color='secondary' />}
            </IconButton>
          </MenuItem>
        ))
      }
    </Box>
  );
}

export default PropertyOptions;
