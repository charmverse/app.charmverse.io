import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import UserRoleIcon from '@mui/icons-material/AssignmentInd';
import CloudSyncOutlinedIcon from '@mui/icons-material/CloudSyncOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/WorkOutline';

export const spaceSettingsSections = ['space', 'roles', 'invites', 'api'] as const;

export type SpaceSettingsSection = (typeof spaceSettingsSections)[number];
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
  { icon: <CloudSyncOutlinedIcon fontSize='small' />, path: 'api', label: 'API' }
];
export const accountSettingsSections = ['account', 'profile', 'notifications'] as const;

export type UserSettingsSection = (typeof accountSettingsSections)[number];

export type UserSettingsTab = SettingsTab<UserSettingsSection>;

export const ACCOUNT_TABS: UserSettingsTab[] = [
  { icon: <ManageAccountsIcon fontSize='small' />, path: 'account', label: 'My Account' },
  { icon: <AccountCircleIcon fontSize='small' />, path: 'profile', label: 'My Profile' },
  { icon: <NotificationsIcon fontSize='small' />, path: 'notifications', label: 'My Notifications' }
];
