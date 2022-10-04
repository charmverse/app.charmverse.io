
import styled from '@emotion/styled';
import Tooltip from '@mui/material/Tooltip';
import { useRouter } from 'next/router';

import Avatar from 'components/common/Avatar';
import Link from 'components/common/Link';
import type { LoggedInUser } from 'models';

import NotificationsBadge from './NotificationsBadge';

const AvatarLink = styled(Link)`
  cursor: pointer;
`;

const MyAvatar = styled(Avatar)<{ active: boolean }>`
  border: 2px solid ${({ theme }) => theme.palette.sidebar.background};
  &:hover {
    box-shadow: 0 0 0 3px ${({ theme }) => theme.palette.sidebar.avatarHighlight};
  }
  ${({ active, theme }) => active && `box-shadow: 0 0 0 3px ${theme.palette.sidebar.avatarHighlight};`}
`;

const nexusRoutes = ['/nexus', '/profile', '/integrations'];

export default function NexusAvatar ({ user }: { user: Pick<LoggedInUser, 'avatar' | 'username'> | null }) {

  const router = useRouter();
  const isNexusActive = nexusRoutes.some(route => router.pathname === route);

  return (
    <AvatarLink href='/nexus'>
      <Tooltip title='My Nexus' placement='right' arrow>
        <span>
          <NotificationsBadge>
            <MyAvatar active={isNexusActive} avatar={user?.avatar} name={user?.username} />
          </NotificationsBadge>
        </span>
      </Tooltip>
    </AvatarLink>
  );
}
