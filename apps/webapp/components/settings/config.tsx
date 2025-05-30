import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AppsIcon from '@mui/icons-material/Apps';
import UserRoleIcon from '@mui/icons-material/AssignmentIndOutlined';
import CloudSyncOutlinedIcon from '@mui/icons-material/CloudSyncOutlined';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import SettingsIcon from '@mui/icons-material/WorkOutline';
import MedalIcon from '@mui/icons-material/WorkspacePremium';
import type { ReactNode } from 'react';
import { FaBriefcase } from 'react-icons/fa';

import { CharmsLogo } from 'components/common/CharmsLogo';
import { ProposalIcon } from 'components/common/PageIcon';

export const premiumSettingSections = ['roles', 'api'] as const;

export type SpaceSettingsSection =
  | 'space'
  | 'roles'
  | 'invites'
  | 'import'
  | 'api'
  | 'subscription'
  | 'credentials'
  | 'proposals'
  | 'integrations'
  | 'notifications';

export type SpaceSettingsTab = { icon: ReactNode; path: SpaceSettingsSection; label: string; adminOnly?: boolean };

export const SPACE_SETTINGS_TABS: SpaceSettingsTab[] = [
  { icon: <SettingsIcon fontSize='small' />, path: 'space', label: 'Overview' },
  { icon: <UserRoleIcon fontSize='small' />, path: 'roles', label: 'Roles & Permissions', adminOnly: true },
  { icon: <GroupAddOutlinedIcon fontSize='small' />, path: 'invites', label: 'Invites', adminOnly: true },
  { icon: <FileDownloadOutlinedIcon fontSize='small' />, path: 'import', label: 'Import' },
  { icon: <CloudSyncOutlinedIcon fontSize='small' />, path: 'api', label: 'API' },
  { icon: <CreditCardIcon fontSize='small' />, path: 'subscription', label: 'Billing' },
  { icon: <MedalIcon fontSize='small' />, path: 'credentials', label: 'Credentials' },
  { icon: <ProposalIcon fontSize='small' />, path: 'proposals', label: 'Proposals' },
  { icon: <AppsIcon fontSize='small' />, path: 'integrations', label: 'Integrations' },
  { icon: <NotificationsOutlinedIcon fontSize='small' />, path: 'notifications', label: 'Notifications' }
];

export type UserSettingsSection = 'account' | 'profile' | 'charms';
export const accountSettingsSections: UserSettingsSection[] = ['account', 'profile', 'charms'];

export const ACCOUNT_TABS = [
  { icon: <ManageAccountsIcon fontSize='small' />, path: 'account', label: 'My Account' },
  { icon: <AccountCircleIcon fontSize='small' />, path: 'profile', label: 'My Profile' },
  { icon: <FaBriefcase fontSize='small' />, path: 'projects', label: 'My Projects' }
] as const;

export type UserSettingsTab = (typeof ACCOUNT_TABS)[number];
export type AccountSettingsSection = UserSettingsTab['path'];
