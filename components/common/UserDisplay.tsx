import type { BoxProps } from '@mui/material';
import { Box, Typography } from '@mui/material';
import type { User } from '@prisma/client';
import type { ReactNode } from 'react';
import { memo } from 'react';

import type { InitialAvatarProps } from 'components/common/Avatar';
import Avatar from 'components/common/Avatar';
import Link from 'components/common/Link';
import { useMemberProfile } from 'components/profile/hooks/useMemberProfile';
import useENSName from 'hooks/useENSName';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';

/**
 * @avatarIcon Pass this to override the user avatar with a custom icon
 */
interface StyleProps extends BoxProps {
  fontSize?: string | number;
  fontWeight?: number | string;
  avatarSize?: InitialAvatarProps['size'];
  hideName?: boolean;
  avatarIcon?: ReactNode;
}

interface BaseComponentProps extends StyleProps {
  username: string;
  avatar?: string | null;
  isNft?: boolean;
}

function BaseComponent({
  avatar,
  username,
  avatarSize,
  fontSize,
  fontWeight,
  isNft,
  hideName,
  ...props
}: BaseComponentProps) {
  return (
    <Box
      display='flex'
      alignItems='center'
      gap={1}
      {...props}
      sx={{
        ...(props.sx ?? {}),
        cursor: props.onClick ? 'pointer' : 'initial'
      }}
    >
      {props.avatarIcon ? (
        <Box sx={{ ml: 0.5, mt: 1 }}>{props.avatarIcon}</Box>
      ) : (
        <Avatar size={avatarSize} name={username} avatar={avatar} isNft={isNft} />
      )}
      {!hideName && (
        <Typography whiteSpace='nowrap' fontSize={fontSize} fontWeight={fontWeight}>
          {username}
        </Typography>
      )}
    </Box>
  );
}

interface AnonUserDisplayProps extends StyleProps {
  address: string;
}

// for when we only have a wallet address
function AnonUserDisplayComponent({ address, ...props }: AnonUserDisplayProps) {
  const ensName = useENSName(address);
  return <BaseComponent username={ensName || address} {...props} />;
}

export const AnonUserDisplay = memo(AnonUserDisplayComponent);

/**
 * @linkToProfile Whether we show a link to user's public profile. Defaults to false.
 */
interface UserDisplayProps extends StyleProps {
  user?: {
    avatar?: string | null;
    username: string;
    path?: string | null;
    id: string;
  } | null;
  linkToProfile?: boolean;
  showMiniProfile?: boolean;
}

function UserDisplay({ showMiniProfile = false, user, linkToProfile = false, ...props }: UserDisplayProps) {
  const { showMemberProfile } = useMemberProfile();

  if (!user) {
    // strip out invalid names
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { hideName, avatarSize, ...boxProps } = props;
    return (
      <Box display='flex' alignItems='center' gap={1} {...boxProps}>
        <Avatar avatar={null} size='small' />
      </Box>
    );
  }

  // Copied from User Details component
  const hostname = typeof window !== 'undefined' ? window.location.origin : '';
  const userPath = user.path || user.id;
  const userLink = `${hostname}/u/${userPath}`;
  const isNft = hasNftAvatar(user);

  if (linkToProfile) {
    return (
      <Link color='inherit' href={userLink} key={user?.id} external={false}>
        <BaseComponent username={user.username} avatar={user.avatar} isNft={isNft} {...props} />
      </Link>
    );
  }

  return (
    <BaseComponent
      onClick={
        showMiniProfile
          ? () => {
              if (showMiniProfile) {
                showMemberProfile(user.id);
              }
            }
          : undefined
      }
      username={user.username}
      avatar={user.avatar}
      isNft={isNft}
      {...props}
    />
  );
}

export default memo(UserDisplay);
