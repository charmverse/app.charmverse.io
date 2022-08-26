import { Box, Divider, ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import {  IPropertyTemplate } from '../../blocks/board';
import { BoardView } from '../../blocks/boardView';
import {  useIntl } from 'react-intl';
import CheckIcon from '../../widgets/icons/check';
import mutator from '../../mutator';
import Menu from '../../widgets/menu';
import { iconForPropertyType } from '../viewHeader/viewHeaderPropertiesMenu';
import { Delete } from '@mui/icons-material';

interface LayoutOptionsProps {
  properties: readonly IPropertyTemplate[];
  view: BoardView;
  groupByProperty?: IPropertyTemplate;
}

function GroupByOptions (props: LayoutOptionsProps) {

  const { groupByProperty, properties, view } = props;

  const showTableUngroup = (view.fields.viewType === 'table' && view.fields.groupById);
  const hasPropertiesToGroupBy = showTableUngroup || (properties || []).filter((o: IPropertyTemplate) => o.type === 'select').length > 0;

  return (
    <Box onClick={e => e.stopPropagation()}>
      {properties?.filter((o: IPropertyTemplate) => o.type === 'select').map((property: IPropertyTemplate) => (
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
          {groupByProperty?.id === property.id ? <CheckIcon /> : null}
        </MenuItem>
      ))}
      {!hasPropertiesToGroupBy && (
        <div className='MenuOption TextOption menu-option disabled-option'>
          <div className='menu-name'>Add a Select type property to group cards</div>
        </div>
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
            <ListItemIcon><Delete color='secondary' /></ListItemIcon>
            <ListItemText color='secondary'>Remove grouping</ListItemText>
          </MenuItem>
        </>
      )}
    </Box>
  );
}

export default GroupByOptions;
