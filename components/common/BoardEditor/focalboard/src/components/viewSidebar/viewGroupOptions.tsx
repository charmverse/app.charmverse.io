import { Delete } from '@mui/icons-material';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import { Box, Divider, ListItem, ListItemIcon, ListItemText, MenuItem, Typography } from '@mui/material';

import type { IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';

import mutator from '../../mutator';
import { iconForPropertyType } from '../viewHeader/viewHeaderPropertiesMenu';

interface LayoutOptionsProps {
  properties: readonly IPropertyTemplate[];
  view: BoardView;
  groupByProperty?: IPropertyTemplate;
}

function GroupByOptions(props: LayoutOptionsProps) {
  const { groupByProperty, properties, view } = props;
  const showTableUngroup = view.fields.viewType === 'table' && view.fields.groupById;
  const hasPropertiesToGroupBy =
    showTableUngroup || (properties || []).filter((o: IPropertyTemplate) => o.type === 'select').length > 0;

  return (
    <Box onClick={(e) => e.stopPropagation()}>
      {properties
        .filter((o: IPropertyTemplate) => o.type === 'select')
        .map((property: IPropertyTemplate) => (
          <MenuItem
            dense
            sx={{
              minWidth: 250
            }}
            key={property.id}
            onClick={() => {
              if (view.fields.groupById === property.id) {
                return;
              }
              mutator.changeViewGroupById(view.id, view.fields.groupById, property.id);
            }}
          >
            <ListItemIcon>{iconForPropertyType(property.type)}</ListItemIcon>
            <ListItemText>{property.name}</ListItemText>
            {groupByProperty?.id === property.id ? <CheckOutlinedIcon fontSize='small' /> : null}
          </MenuItem>
        ))}
      {!hasPropertiesToGroupBy && (
        <ListItem>
          <Typography variant='body2'>
            Add a <em>Select type</em> property to group cards
          </Typography>
        </ListItem>
      )}
      {showTableUngroup && (
        <>
          <Divider />
          <MenuItem
            dense
            sx={{
              minWidth: 250
            }}
            onClick={() => {
              if (view.fields.groupById === '') {
                return;
              }
              mutator.changeViewGroupById(view.id, view.fields.groupById, '');
            }}
          >
            <ListItemIcon>
              <Delete color='secondary' />
            </ListItemIcon>
            <ListItemText color='secondary'>Remove grouping</ListItemText>
          </MenuItem>
        </>
      )}
    </Box>
  );
}

export default GroupByOptions;
