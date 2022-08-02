// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, { useState, MouseEvent } from 'react';
import { FormattedMessage } from 'react-intl';
import Menu from '@mui/material/Menu';
import { IconButton, ListItemIcon, ListItemText, MenuItem, SvgIconProps } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ListIcon from '@mui/icons-material/List';
import NumbersIcon from '@mui/icons-material/Numbers';
import PhoneIcon from '@mui/icons-material/Phone';
import ArrowDropDownCircleIcon from '@mui/icons-material/ArrowDropDownCircle';
import SubjectIcon from '@mui/icons-material/Subject';
import LinkIcon from '@mui/icons-material/Link';
import Button from '../../widgets/buttons/button';
import mutator from '../../mutator';
import { BoardView } from '../../blocks/boardView';
import { IPropertyTemplate, PropertyType } from '../../blocks/board';

type Props = {
    properties: readonly IPropertyTemplate[]
    activeView: BoardView
}

export const iconForPropertyType = (propertyType: PropertyType, props?: SvgIconProps) => {
  switch (propertyType) {
    case 'checkbox': return <CheckBoxIcon fontSize='small' {...props} />;
    case 'createdBy': return <PersonIcon fontSize='small' {...props} />;
    case 'createdTime': return <AccessTimeIcon fontSize='small' {...props} />;
    case 'date': return <EventNoteIcon fontSize='small' {...props} />;
    case 'email': return <AlternateEmailIcon fontSize='small' {...props} />;
    case 'file': return <AttachFileIcon fontSize='small' {...props} />;
    case 'multiSelect': return <ListIcon fontSize='small' {...props} />;
    case 'number': return <NumbersIcon fontSize='small' {...props} />;
    case 'person': return <PersonIcon fontSize='small' {...props} />;
    case 'phone': return <PhoneIcon fontSize='small' {...props} />;
    case 'select': return <ArrowDropDownCircleIcon fontSize='small' {...props} />;
    case 'text': return <SubjectIcon fontSize='small' {...props} />;
    case 'updatedBy': return <PersonIcon fontSize='small' {...props} />;
    case 'updatedTime': return <AccessTimeIcon fontSize='small' {...props} />;
    case 'url': return <LinkIcon fontSize='small' {...props} />;
  }
};

const ViewHeaderPropertiesMenu = React.memo((props: Props) => {
  const { properties, activeView } = props;
  const { visiblePropertyIds } = activeView.fields;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const toggleVisibility = (propertyId: string) => {
    let newVisiblePropertyIds = [];
    if (visiblePropertyIds.includes(propertyId)) {
      newVisiblePropertyIds = visiblePropertyIds.filter((o: string) => o !== propertyId);
    }
    else {
      newVisiblePropertyIds = [...visiblePropertyIds, propertyId];
    }
    mutator.changeViewVisibleProperties(activeView.id, visiblePropertyIds, newVisiblePropertyIds);
  };

  const showPropertiesMenu = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const hidePropertiesMenu = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button onClick={showPropertiesMenu}>
        <FormattedMessage
          id='ViewHeader.properties'
          defaultMessage='Properties'
        />
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={hidePropertiesMenu}
      >
        {
            properties.map(property => (
              <MenuItem
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
      </Menu>

      {/* <MenuWrapper label={intl.formatMessage({id: 'ViewHeader.properties-menu', defaultMessage: 'Properties menu'})}>

            <Menu>
                {activeView.fields.viewType === 'gallery' &&
                    <Menu.Switch
                        key={Constants.titleColumnId}
                        id={Constants.titleColumnId}
                        name={intl.formatMessage({id: 'default-properties.title', defaultMessage: 'Title'})}
                        isOn={visiblePropertyIds.includes(Constants.titleColumnId)}
                        onClick={toggleVisibility}
                    />}
                {properties?.map((option: IPropertyTemplate) => (
                    <Menu.Switch
                        key={option.id}
                        id={option.id}
                        name={option.name}
                        isOn={visiblePropertyIds.includes(option.id)}
                        onClick={toggleVisibility}
                    />
                ))}
            </Menu>
        </MenuWrapper> */}
    </>
  );
});

export default ViewHeaderPropertiesMenu;
