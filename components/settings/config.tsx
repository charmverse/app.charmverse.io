import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import UserRoleIcon from '@mui/icons-material/AssignmentIndOutlined';
import CloudSyncOutlinedIcon from '@mui/icons-material/CloudSyncOutlined';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SettingsIcon from '@mui/icons-material/WorkOutline';
import MedalIcon from '@mui/icons-material/WorkspacePremium';
import { SvgIcon } from '@mui/material';

import { CharmsLogo } from 'components/common/CharmsLogo';
import { ProposalIcon } from 'components/common/PageIcon';

export const premiumSettingSections = ['roles', 'api'] as const;

export const SPACE_SETTINGS_TABS = [
  { icon: <SettingsIcon fontSize='small' />, path: 'space', label: 'Overview' },
  { icon: <UserRoleIcon fontSize='small' />, path: 'roles', label: 'Roles & Permissions' },
  { icon: <GroupAddOutlinedIcon fontSize='small' />, path: 'invites', label: 'Invites' },
  { icon: <FileDownloadOutlinedIcon fontSize='small' />, path: 'import', label: 'Import' },
  { icon: <CloudSyncOutlinedIcon fontSize='small' />, path: 'api', label: 'API' },
  { icon: <CreditCardIcon fontSize='small' />, path: 'subscription', label: 'Billing' },
  { icon: <MedalIcon fontSize='small' />, path: 'credentials', label: 'Credentials' },
  { icon: <ProposalIcon fontSize='small' />, path: 'proposals', label: 'Proposals' }
] as const;

export type SpaceSettingsTab = (typeof SPACE_SETTINGS_TABS)[number];
export type SpaceSettingsSection = SpaceSettingsTab['path'];
export const accountSettingsSections = ['account', 'profile', 'charms'] as const;

export type UserSettingsSection = (typeof accountSettingsSections)[number];

export const ACCOUNT_TABS = [
  { icon: <ManageAccountsIcon fontSize='small' />, path: 'account', label: 'My Account' },
  { icon: <AccountCircleIcon fontSize='small' />, path: 'profile', label: 'My Profile' },
  {
    icon: <CharmsLogo />,
    path: 'charms',
    label: 'Charms'
  }
] as const;

export type UserSettingsTab = (typeof ACCOUNT_TABS)[number];
export type AccountSettingsSection = UserSettingsTab['path'];
