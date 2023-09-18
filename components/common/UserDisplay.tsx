import type { BoxProps } from '@mui/material';
import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { memo } from 'react';

import type { InitialAvatarProps } from 'components/common/Avatar';
import Avatar from 'components/common/Avatar';
import { useUserProfile } from 'components/common/UserProfile/hooks/useUserProfile';
import { useENSName } from 'hooks/useENSName';
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
  wrapName?: boolean;
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
  wrapName,
  ...props
}: BaseComponentProps) {
  return (
    <Box
      display='flex'
      alignItems='center'
      gap={1}
      {...props}
      sx={{
        cursor: props.onClick ? 'pointer' : 'initial',
        ...(props.sx ?? {})
      }}
    >
      {props.avatarIcon ? (
        <Box sx={{ ml: 0.5, mt: 1 }}>{props.avatarIcon}</Box>
      ) : (
        <Avatar size={avatarSize} name={username} avatar={avatar} isNft={isNft} />
      )}
      {!hideName && (
        <Typography whiteSpace={wrapName ? 'break-spaces' : 'nowrap'} fontSize={fontSize} fontWeight={fontWeight}>
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
  showMiniProfile?: boolean;
}

function UserDisplay({ showMiniProfile = false, user, ...props }: UserDisplayProps) {
  const { showUserProfile } = useUserProfile();

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

  const isNft = hasNftAvatar(user);

  return (
    <BaseComponent
      onClick={
        showMiniProfile
          ? () => {
              if (showMiniProfile) {
                showUserProfile(user.id);
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
