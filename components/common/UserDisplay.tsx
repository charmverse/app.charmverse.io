import { memo } from 'react';
import { Box, BoxProps, Typography } from '@mui/material';
import useENSName from 'hooks/useENSName';
import { User } from '@prisma/client';
import Avatar from 'components/common/Avatar';
import Link from 'components/common/Link';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';

interface StyleProps extends BoxProps {
  fontSize?: string | number;
  fontWeight?: number | string;
  avatarSize?: 'small' | 'medium';
}

interface BaseComponentProps extends StyleProps {
  username: string;
  avatar?: string | null;
  isNft?: boolean;
}

function BaseComponent ({ avatar, username, avatarSize, fontSize, fontWeight, isNft, ...props }: BaseComponentProps) {

  return (
    <Box display='flex' alignItems='center' gap={1} {...props}>
      <Avatar size={avatarSize} name={username} avatar={avatar} isNft={isNft} />
      <Typography whiteSpace='nowrap' fontSize={fontSize} fontWeight={fontWeight}>{username}</Typography>
    </Box>
  );
}

interface AnonUserDisplayProps extends StyleProps {
  address: string;
}

// for when we only have a wallet address
function AnonUserDisplayComponent ({ address, ...props }: AnonUserDisplayProps) {
  const ensName = useENSName(address);
  return (
    <BaseComponent username={ensName || address} {...props} />
  );
}

export const AnonUserDisplay = memo(AnonUserDisplayComponent);

/**
 * @linkToProfile Whether we show a link to user's public profile. Defaults to false.
 */
interface UserDisplayProps extends StyleProps {
  user: Omit<User, 'addresses'>;
  linkToProfile?: boolean
}

function UserDisplay ({ user, linkToProfile = false, ...props }: UserDisplayProps) {
  // Copied from User Details component
  const hostname = typeof window !== 'undefined' ? window.location.origin : '';
  const userPath = user.path || user.id;
  const userLink = `${hostname}/u/${userPath}`;
  const isNft = hasNftAvatar(user);

  if (linkToProfile) {
    return (
      <Link color='inherit' href={userLink} key={user?.id} external={false}>
        <BaseComponent username={user.username as string} avatar={user.avatar} isNft={isNft} {...props} />
      </Link>
    );
  }

  return (
    <BaseComponent username={user.username as string} avatar={user.avatar} isNft={isNft} {...props} />
  );

}

export default memo(UserDisplay);
