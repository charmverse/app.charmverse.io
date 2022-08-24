
import styled from '@emotion/styled';
import { LoggedInUser } from 'models';
import { useRouter } from 'next/router';
import Avatar from 'components/common/Avatar';
import MuiLink from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import NextLink from 'next/link';

const AvatarLink = styled(NextLink)`
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
    <AvatarLink href='/nexus' passHref>
      <MuiLink>
        <Tooltip title='My Nexus' placement='right' arrow>
          <span>
            <MyAvatar active={isNexusActive} avatar={user?.avatar} name={user?.username} />
          </span>
        </Tooltip>
      </MuiLink>
    </AvatarLink>
  );
}
