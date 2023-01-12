import UserRoleIcon from '@mui/icons-material/AssignmentInd';
import CloudSyncOutlinedIcon from '@mui/icons-material/CloudSyncOutlined';
import PersonIcon from '@mui/icons-material/Group';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import SettingsIcon from '@mui/icons-material/WorkOutline';

export const SETTINGS_TABS = [
  { icon: <SettingsIcon fontSize='small' />, path: 'workspace', label: 'Workspace' },
  { icon: <PersonIcon fontSize='small' />, path: 'members', label: 'Members' },
  { icon: <UserRoleIcon fontSize='small' />, path: 'roles', label: 'Roles & Permissions' },
  { icon: <GroupAddOutlinedIcon fontSize='small' />, path: 'invites', label: 'Invites' },
  { icon: <CloudSyncOutlinedIcon fontSize='small' />, path: 'api', label: 'API' }
];
