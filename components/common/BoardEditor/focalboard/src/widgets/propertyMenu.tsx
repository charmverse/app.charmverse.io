import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { ListItemIcon, ListItemText, Divider, Menu, MenuItem, TextField, Typography, Stack } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import React, { useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import type { Board, IPropertyTemplate, PropertyType, RelationPropertyData } from 'lib/focalboard/board';

import { DeleteRelationPropertyModal } from '../components/properties/relation/DeleteRelationPropertyModal';

import { PropertyTypes } from './propertyTypes';
import { typeDisplayName } from './typeDisplayName';

type Props = {
  onTypeAndNameChanged: (newType: PropertyType, newName: string, relationData?: RelationPropertyData) => void;
  onDelete: (id: string) => void;
  deleteDisabled?: boolean;
  property: IPropertyTemplate;
  board: Board;
};

const PropertyMenu = React.memo((props: Props) => {
  const nameTextbox = useRef<HTMLInputElement>(null);
  const propertyType = props.property.type;
  const propertyId = props.property.id;
  const propertyName = props.property.name;
  const [name, setName] = useState(propertyName);
  const changePropertyTypePopupState = usePopupState({ variant: 'popover', popupId: 'card-property-type' });
  const showRelationPropertyDeletePopup = usePopupState({ variant: 'popover', popupId: 'delete-relation-property' });
  const intl = useIntl();
  return (
    <Stack gap={1}>
      <TextField
        sx={{
          mx: 1
        }}
        inputProps={{
          ref: nameTextbox
        }}
        className='PropertyMenu'
        type='text'
        autoFocus
        onChange={(e) => {
          setName(e.target.value);
        }}
        value={name}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') {
            props.onTypeAndNameChanged(propertyType, name);
            e.stopPropagation();
            if (e.key === 'Enter') {
              e.target.dispatchEvent(new Event('menuItemClicked'));
            }
          }
        }}
      />
      <MenuItem
        {...bindTrigger(changePropertyTypePopupState)}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
      >
        <ListItemText>Type: {typeDisplayName(intl, propertyType)}</ListItemText>
        <ArrowRightIcon fontSize='small' />
      </MenuItem>
      <Divider sx={{ my: '0 !important' }} />
      <MenuItem onClick={() => props.onDelete(propertyId)}>
        <ListItemIcon>
          <DeleteOutlinedIcon fontSize='small' />
        </ListItemIcon>
        <ListItemText>Delete property</ListItemText>
      </MenuItem>
      <Menu
        {...bindMenu(changePropertyTypePopupState)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'left'
        }}
      >
        <PropertyTypes
          selectedTypes={[propertyType]}
          onClick={({ type, relationData }) => {
            if (type !== propertyType) {
              // only change the type if it's different
              props.onTypeAndNameChanged(type, name, relationData);
              changePropertyTypePopupState.close();
            }
          }}
        />
      </Menu>
      {showRelationPropertyDeletePopup.isOpen && (
        <DeleteRelationPropertyModal
          board={props.board}
          template={props.property}
          onClose={showRelationPropertyDeletePopup.close}
        />
      )}
    </Stack>
  );
});

export default PropertyMenu;
