
import styled from '@emotion/styled';
import { css, Theme } from '@emotion/react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import TasksIcon from '@mui/icons-material/FormatListNumbered';
import ProfileIcon from '@mui/icons-material/AccountBox';
import KeyIcon from '@mui/icons-material/Key';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useUser } from 'hooks/useUser';
import { useRouter } from 'next/router';
import Link from 'components/common/Link';
import Workspaces from 'components/common/PageLayout/components/Sidebar/Workspaces';
import { getDisplayName } from 'lib/users';
import { headerHeight } from 'components/common/PageLayout/components/Header';

const sidebarLinks = [
  { title: 'My Tasks', icon: <TasksIcon />, path: '/profile/tasks' },
  { title: 'Public Profile', icon: <ProfileIcon />, path: '/profile/public' },
  { title: 'Integrations', icon: <KeyIcon />, path: '/profile/integrations' }
];

const SidebarContainer = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.palette.sidebar.background};
  height: 100%;

  .add-a-page {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }

  &:hover {
    .sidebar-header {
      .MuiTypography-root {
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .MuiIconButton-root {
        opacity: 1;
      }
    }
  }

  &:hover .add-a-page {
    opacity: 1;
  }
`;

const sidebarItemStyles = ({ theme }: { theme: Theme }) => css`
  padding-left: ${theme.spacing(2)};
  padding-right: ${theme.spacing(2)};
`;

const SectionName = styled(Typography)`
  ${sidebarItemStyles}
  color: ${({ theme }) => theme.palette.secondary.main};
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.03em;
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

const StyledSidebarLink = styled(Link)<{ active: boolean }>`
  ${sidebarItemStyles}
  align-items: center;
  color: ${({ theme }) => theme.palette.secondary.main};
  display: flex;
  font-size: 14px;
  font-weight: 500;
  padding-top: 4px;
  padding-bottom: 4px;
  :hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
    color: inherit;
  }
  ${({ active, theme }) => active ? `
    background-color: ${theme.palette.action.selected};
    color: ${theme.palette.text.primary};
  ` : ''}
  svg {
    font-size: 1.2em;
    margin-right: ${({ theme }) => theme.spacing(1)};
  }
`;

const SidebarHeader = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1.5, 0, 2),
  '& .MuiIconButton-root': {
    opacity: 0,
    borderRadius: '4px',
    transition: theme.transitions.create('opacity', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  // necessary for content to be below app bar
  minHeight: headerHeight
}));

function SidebarLink ({ active, href, icon, label, target }: { active: boolean, href: string, icon: any, label: string, target?: string }) {
  return (
    <StyledSidebarLink href={href} active={active} target={target}>
      {icon}
      {label}
    </StyledSidebarLink>
  );
}

interface SidebarProps {
  closeSidebar: () => void;
}

export default function Sidebar ({ closeSidebar }: SidebarProps) {
  const router = useRouter();
  const [user] = useUser();

  const userName = user ? getDisplayName(user) : '';

  return (
    <SidebarContainer>
      <Workspaces />

      <Box display='flex' flexDirection='column' sx={{ height: '100%', flexGrow: 1, width: 'calc(100% - 57px)' }}>
        <SidebarHeader className='sidebar-header'>
          <Typography><strong>{userName}</strong></Typography>
          <IconButton onClick={closeSidebar} size='small'>
            <ChevronLeftIcon />
          </IconButton>
        </SidebarHeader>
        <Box mb={2}>
          <SectionName>
            MY NEXUS
          </SectionName>
          {sidebarLinks.map(link => (
            <SidebarLink
              href={link.path}
              key={link.path}
              active={router.pathname === link.path}
              icon={link.icon}
              label={link.title}
            />
          ))}
        </Box>
      </Box>
    </SidebarContainer>
  );
}
