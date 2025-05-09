import { DeleteOutlined } from '@mui/icons-material';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import { Box, Divider, ListItem, ListItemIcon, ListItemText, MenuItem, Typography } from '@mui/material';

import type { IPropertyTemplate, PropertyType } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';

import mutator from '../../mutator';
import { iconForPropertyType } from '../../widgets/iconForPropertyType';

interface LayoutOptionsProps {
  properties: readonly IPropertyTemplate[];
  view: BoardView;
  groupByProperty?: IPropertyTemplate;
}

function GroupByOptions(props: LayoutOptionsProps) {
  const { groupByProperty, properties, view } = props;
  const showTableUngroup = view.fields.viewType === 'table' && view.fields.groupById;

  const groupablePropertyTypes: PropertyType[] = [
    'select',
    'proposalStatus',
    'proposalEvaluationType',
    'proposalStep',
    'proposalUrl'
  ];

  const filteredProperties = (properties ?? [])?.filter((o: IPropertyTemplate) =>
    groupablePropertyTypes.includes(o.type)
  );

  const hasPropertiesToGroupBy = showTableUngroup || filteredProperties.length > 0;

  return (
    <Box onClick={(e) => e.stopPropagation()}>
      {filteredProperties.map((property: IPropertyTemplate) => (
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
              <DeleteOutlined color='secondary' />
            </ListItemIcon>
            <ListItemText color='secondary'>Remove grouping</ListItemText>
          </MenuItem>
        </>
      )}
    </Box>
  );
}

export default GroupByOptions;
