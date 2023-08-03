import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import UserRoleIcon from '@mui/icons-material/AssignmentIndOutlined';
import CloudSyncOutlinedIcon from '@mui/icons-material/CloudSyncOutlined';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SettingsIcon from '@mui/icons-material/WorkOutline';

export const spaceSettingsSections = ['space', 'roles', 'invites', 'import', 'api', 'subscription'] as const;

export type SpaceSettingsSection = (typeof spaceSettingsSections)[number];

export const premiumSettingSections: Extract<SpaceSettingsSection, 'roles' | 'api'>[] = ['roles', 'api'];

type SettingsTab<T extends string> = {
  icon: JSX.Element;
  path: T;
  label: string;
};

export type SpaceSettingsTab = SettingsTab<SpaceSettingsSection>;

export const SETTINGS_TABS: SpaceSettingsTab[] = [
  { icon: <SettingsIcon fontSize='small' />, path: 'space', label: 'Overview' },
  { icon: <UserRoleIcon fontSize='small' />, path: 'roles', label: 'Roles & Permissions' },
  { icon: <GroupAddOutlinedIcon fontSize='small' />, path: 'invites', label: 'Invites' },
  { icon: <FileDownloadOutlinedIcon fontSize='small' />, path: 'import', label: 'Import' },
  { icon: <CloudSyncOutlinedIcon fontSize='small' />, path: 'api', label: 'API' },
  { icon: <CreditCardIcon fontSize='small' />, path: 'subscription', label: 'Billing' }
];

export const accountSettingsSections = ['account', 'profile'] as const;

export type UserSettingsSection = (typeof accountSettingsSections)[number];

export type UserSettingsTab = SettingsTab<UserSettingsSection>;

export const ACCOUNT_TABS: UserSettingsTab[] = [
  { icon: <ManageAccountsIcon fontSize='small' />, path: 'account', label: 'My Account' },
  { icon: <AccountCircleIcon fontSize='small' />, path: 'profile', label: 'My Profile' }
];
