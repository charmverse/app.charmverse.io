import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import UserRoleIcon from '@mui/icons-material/AssignmentInd';
import CloudSyncOutlinedIcon from '@mui/icons-material/CloudSyncOutlined';
import PersonIcon from '@mui/icons-material/Group';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/WorkOutline';

export const SETTINGS_TABS = [
  { icon: <SettingsIcon fontSize='small' />, path: 'space', label: 'Space' },
  { icon: <PersonIcon fontSize='small' />, path: 'members', label: 'Members' },
  { icon: <UserRoleIcon fontSize='small' />, path: 'roles', label: 'Roles & Permissions' },
  { icon: <GroupAddOutlinedIcon fontSize='small' />, path: 'invites', label: 'Invites' },
  { icon: <CloudSyncOutlinedIcon fontSize='small' />, path: 'api', label: 'API' }
];

export const ACCOUNT_TABS = [
  { icon: <ManageAccountsIcon fontSize='small' />, path: 'account', label: 'My Account' },
  { icon: <AccountCircleIcon fontSize='small' />, path: 'profile', label: 'My Profile' },
  { icon: <NotificationsIcon fontSize='small' />, path: 'notifications', label: 'My Notifications' }
];
