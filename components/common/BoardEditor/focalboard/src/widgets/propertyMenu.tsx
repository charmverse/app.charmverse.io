import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { ListItemIcon, Menu, MenuItem, TextField, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import React, { useRef, useState } from 'react';
import type { IntlShape } from 'react-intl';

import type { IPropertyTemplate, PropertyType } from 'lib/focalboard/board';

import { Utils } from '../utils';

import { PropertyTypes } from './propertyTypes';

type Props = {
  onTypeAndNameChanged: (newType: PropertyType, newName: string) => void;
  onDelete: (id: string) => void;
  deleteDisabled?: boolean;
  property: IPropertyTemplate;
};

export function typeDisplayName(intl: IntlShape, type: PropertyType): string {
  switch (type) {
    case 'text':
      return intl.formatMessage({ id: 'PropertyType.Text', defaultMessage: 'Text' });
    case 'number':
      return intl.formatMessage({ id: 'PropertyType.Number', defaultMessage: 'Number' });
    case 'select':
      return intl.formatMessage({ id: 'PropertyType.Select', defaultMessage: 'Select' });
    case 'multiSelect':
      return intl.formatMessage({ id: 'PropertyType.MultiSelect', defaultMessage: 'Multi Select' });
    case 'person':
      return intl.formatMessage({ id: 'PropertyType.Person', defaultMessage: 'Person' });
    case 'file':
      return intl.formatMessage({ id: 'PropertyType.File', defaultMessage: 'File or Media' });
    case 'checkbox':
      return intl.formatMessage({ id: 'PropertyType.Toggle', defaultMessage: 'Toggle' });
    case 'url':
      return intl.formatMessage({ id: 'PropertyType.URL', defaultMessage: 'URL' });
    case 'email':
      return intl.formatMessage({ id: 'PropertyType.Email', defaultMessage: 'Email' });
    case 'phone':
      return intl.formatMessage({ id: 'PropertyType.Phone', defaultMessage: 'Phone' });
    case 'createdTime':
      return intl.formatMessage({ id: 'PropertyType.CreatedTime', defaultMessage: 'Created time' });
    case 'createdBy':
      return intl.formatMessage({ id: 'PropertyType.CreatedBy', defaultMessage: 'Created by' });
    case 'updatedTime':
      return intl.formatMessage({ id: 'PropertyType.UpdatedTime', defaultMessage: 'Last updated time' });
    case 'updatedBy':
      return intl.formatMessage({ id: 'PropertyType.UpdatedBy', defaultMessage: 'Last updated by' });
    case 'date':
      return intl.formatMessage({ id: 'PropertyType.Date', defaultMessage: 'Date' });
    default: {
      Utils.assertFailure(`typeDisplayName, unhandled type: ${type}`);
      return type;
    }
  }
}

export const propertyTypesList: PropertyType[] = [
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
  'createdTime',
  'createdBy',
  'updatedTime',
  'updatedBy'
];

const PropertyMenu = React.memo((props: Props) => {
  const nameTextbox = useRef<HTMLInputElement>(null);
  const propertyType = props.property.type;
  const propertyId = props.property.id;
  const propertyName = props.property.name;
  const [name, setName] = useState(propertyName);
  const changePropertyTypePopupState = usePopupState({ variant: 'popover', popupId: 'card-property-type' });
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
        onBlur={() => props.onTypeAndNameChanged(propertyType, name)}
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
        <Typography variant='subtitle1'>Type: {propertyName}</Typography>
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
        <PropertyTypes onClick={(type) => props.onTypeAndNameChanged(type, name)} />
      </Menu>
    </Stack>
  );
});

export default PropertyMenu;
