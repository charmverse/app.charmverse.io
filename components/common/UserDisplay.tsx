import { memo } from 'react';
import { Box, BoxProps, Typography } from '@mui/material';
import useENSName from 'hooks/useENSName';
import { User } from '@prisma/client';
import Avatar from 'components/common/Avatar';
import getDisplayName from 'lib/users/getDisplayName';

interface StyleProps extends BoxProps {
  fontSize?: string | number;
  fontWeight?: number | string;
  avatarSize?: 'small' | 'medium';
}

interface BaseComponentProps extends StyleProps {
  username: string;
  avatar?: string | null;
}

function BaseComponent ({ avatar, username, avatarSize, fontSize, fontWeight, ...props }: BaseComponentProps) {

  return (
    <Box display='flex' alignItems='center' gap={1} {...props}>
      <Avatar size={avatarSize} name={username} avatar={avatar} />
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

interface UserDisplayProps extends StyleProps {
  user: User;
}

function UserDisplay ({ user, ...props }: UserDisplayProps) {
  const ensName = useENSName(user.addresses[0]);
  return (
    <BaseComponent username={ensName || getDisplayName(user)} avatar={user.avatar} {...props} />
  );
}

export default memo(UserDisplay);
