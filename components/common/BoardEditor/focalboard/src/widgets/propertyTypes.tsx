import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import ArrowDropDownCircleIcon from '@mui/icons-material/ArrowDropDownCircle';
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import LinkIcon from '@mui/icons-material/Link';
import ListIcon from '@mui/icons-material/List';
import NumbersIcon from '@mui/icons-material/Numbers';
import PermIdentityOutlinedIcon from '@mui/icons-material/PermIdentityOutlined';
import PhoneIcon from '@mui/icons-material/Phone';
import TextIcon from '@mui/icons-material/TextFields';
import { Divider, ListItemIcon, MenuItem, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import type { ReactNode } from 'react';
import { useIntl } from 'react-intl';

import type { PropertyType } from 'lib/focalboard/board';

import { propertyTypesList, typeDisplayName } from './propertyMenu';

export const MemberPropertyIcons: Record<PropertyType, ReactNode> = {
  checkbox: <CheckBoxOutlinedIcon fontSize='small' />,
  createdBy: <PermIdentityOutlinedIcon fontSize='small' />,
  createdTime: <AccessTimeOutlinedIcon fontSize='small' />,
  date: <CalendarMonthIcon fontSize='small' />,
  file: <AttachFileOutlinedIcon fontSize='small' />,
  multiSelect: <ListIcon fontSize='small' />,
  person: <PermIdentityOutlinedIcon fontSize='small' />,
  updatedBy: <PermIdentityOutlinedIcon fontSize='small' />,
  updatedTime: <AccessTimeOutlinedIcon fontSize='small' />,
  text: <TextIcon fontSize='small' />,
  number: <NumbersIcon fontSize='small' />,
  phone: <PhoneIcon fontSize='small' />,
  url: <LinkIcon fontSize='small' />,
  email: <AlternateEmailIcon fontSize='small' />,
  select: <ArrowDropDownCircleIcon fontSize='small' />
};

export function PropertyTypes({ onClick }: { onClick: (type: PropertyType) => void }) {
  const intl = useIntl();
  return (
    <Stack gap={0.5}>
      <Typography px={1} color='secondary' variant='subtitle1'>
        Select property type
      </Typography>
      <Divider />
      {propertyTypesList.map((type) => (
        <MenuItem onClick={() => onClick(type)} key={type}>
          <ListItemIcon>{MemberPropertyIcons[type]}</ListItemIcon>
          <Typography>{typeDisplayName(intl, type)}</Typography>
        </MenuItem>
      ))}
    </Stack>
  );
}
