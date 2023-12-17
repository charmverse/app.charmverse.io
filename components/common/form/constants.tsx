import type { FormFieldType } from '@charmverse/core/prisma-client';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import ArrowDropDownCircleIcon from '@mui/icons-material/ArrowDropDownCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LinkIcon from '@mui/icons-material/Link';
import ListIcon from '@mui/icons-material/List';
import NotesIcon from '@mui/icons-material/Notes';
import NumbersIcon from '@mui/icons-material/Numbers';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import ShortTextIcon from '@mui/icons-material/ShortText';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import type { ReactNode } from 'react';

export const formFieldTypes = [
  'short_text',
  'long_text',
  'number',
  'phone',
  'url',
  'email',
  'select',
  'multiselect',
  'wallet',
  'date',
  'person',
  'label'
] as const;

export const fieldTypeLabelRecord: Record<FormFieldType, string> = {
  date: 'Date',
  email: 'Email',
  label: 'Label',
  multiselect: 'Multi-select',
  number: 'Number',
  person: 'Person',
  phone: 'Phone',
  select: 'Select',
  short_text: 'Short Text',
  long_text: 'Long Text',
  url: 'URL',
  wallet: 'Wallet Address'
};

export const fieldTypeIconRecord: Record<FormFieldType, ReactNode> = {
  short_text: <ShortTextIcon fontSize='small' />,
  long_text: <NotesIcon fontSize='small' />,
  number: <NumbersIcon fontSize='small' />,
  phone: <PhoneIcon fontSize='small' />,
  url: <LinkIcon fontSize='small' />,
  email: <AlternateEmailIcon fontSize='small' />,
  select: <ArrowDropDownCircleIcon fontSize='small' />,
  multiselect: <ListIcon fontSize='small' />,
  wallet: <AccountBalanceWalletIcon fontSize='small' />,
  date: <CalendarMonthIcon fontSize='small' />,
  label: <TextFieldsIcon fontSize='small' />,
  person: <PersonIcon fontSize='small' />
};
