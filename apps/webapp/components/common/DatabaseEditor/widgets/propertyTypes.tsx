import { Divider, ListItemIcon, MenuItem, Stack, Typography } from '@mui/material';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useIntl } from 'react-intl';

import type { IPropertyTemplate, PropertyType } from '@packages/databases/board';

import { RelationPropertyMenu } from '../components/properties/relation/RelationPropertyMenu/RelationPropertyMenu';

import { iconForPropertyType } from './iconForPropertyType';
import { typeDisplayName } from './typeDisplayName';

const propertyTypesList: PropertyType[] = [
  'text',
  'number',
  'email',
  'phone',
  'url',
  'select',
  'multiSelect',
  'date',
  'person',
  'checkbox',
  'relation',
  'createdTime',
  'createdBy',
  'updatedTime',
  'updatedBy'
];

export function PropertyTypes({
  selectedTypes = [],
  onClick,
  isMobile,
  boardType
}: {
  selectedTypes?: PropertyType[];
  onClick: (property: {
    type: PropertyType;
    relationData?: IPropertyTemplate['relationData'];
    name?: IPropertyTemplate['name'];
  }) => void;
  isMobile?: boolean;
  // This indicates what type of board (proposals, rewards or regular) this component is being used in
  boardType?: 'proposals' | 'rewards';
}) {
  const addRelationPropertyPopupState = usePopupState({ variant: 'popover', popupId: 'add-relation-property' });
  const bindTriggerProps = bindTrigger(addRelationPropertyPopupState);

  const intl = useIntl();
  return (
    <>
      <Stack gap={isMobile ? 0 : 0.5}>
        {!isMobile && (
          <>
            <Typography px={1} color='secondary' variant='subtitle1'>
              Select property type
            </Typography>
            <Divider />
          </>
        )}
        {(boardType !== undefined ? propertyTypesList.filter((ptl) => ptl !== 'relation') : propertyTypesList).map(
          (type) => {
            return (
              <MenuItem
                selected={selectedTypes.includes(type)}
                data-test={`select-property-${type}`}
                key={type}
                {...(type === 'relation'
                  ? bindTriggerProps
                  : {
                      onClick: () => onClick({ type })
                    })}
              >
                <ListItemIcon>{iconForPropertyType(type)}</ListItemIcon>
                <Typography>{typeDisplayName(intl, type)}</Typography>
              </MenuItem>
            );
          }
        )}
      </Stack>
      <RelationPropertyMenu onClick={onClick} popupState={addRelationPropertyPopupState} />
    </>
  );
}
