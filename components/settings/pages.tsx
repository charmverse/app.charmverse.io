
import UserRoleIcon from '@mui/icons-material/AssignmentInd';
import PersonIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/WorkOutline';

export const SETTINGS_TABS = [
  { icon: <SettingsIcon fontSize='small' />, path: 'workspace', label: 'Workspace' },
  { icon: <PersonIcon fontSize='small' />, path: 'contributors', label: 'Contributors' },
  { icon: <UserRoleIcon fontSize='small' />, path: 'roles', label: 'Roles & Permissions' }
];
