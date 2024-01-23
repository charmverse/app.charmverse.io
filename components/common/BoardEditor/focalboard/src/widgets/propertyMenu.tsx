import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { ListItemIcon, Menu, MenuItem, TextField, Typography, Stack } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import React, { useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import type { IPropertyTemplate, PropertyType } from 'lib/focalboard/board';

import { PropertyTypes } from './propertyTypes';
import { typeDisplayName } from './typeDisplayName';

type Props = {
  onTypeAndNameChanged: (newType: PropertyType, newName: string) => void;
  onDelete: (id: string) => void;
  deleteDisabled?: boolean;
  property: IPropertyTemplate;
};

const PropertyMenu = React.memo((props: Props) => {
  const nameTextbox = useRef<HTMLInputElement>(null);
  const propertyType = props.property.type;
  const propertyId = props.property.id;
  const propertyName = props.property.name;
  const [name, setName] = useState(propertyName);
  const changePropertyTypePopupState = usePopupState({ variant: 'popover', popupId: 'card-property-type' });
  const intl = useIntl();
  return (
    <Stack gap={1}>
      <TextField
        sx={{
          mx: 1,
          my: 1
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
      <MenuItem onClick={() => props.onDelete(propertyId)}>
        <ListItemIcon>
          <DeleteOutlinedIcon fontSize='small' />
        </ListItemIcon>
        <Typography variant='subtitle1'>Delete</Typography>
      </MenuItem>
      <MenuItem
        {...bindTrigger(changePropertyTypePopupState)}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant='subtitle1'>Type: {typeDisplayName(intl, propertyType)}</Typography>
        <ArrowRightIcon fontSize='small' />
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
          onClick={(type) => {
            if (type !== propertyType) {
              // only change the type if it's different
              props.onTypeAndNameChanged(type, name);
              changePropertyTypePopupState.close();
            }
          }}
        />
      </Menu>
    </Stack>
  );
});

export default PropertyMenu;
