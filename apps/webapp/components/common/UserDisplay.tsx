import type { BoxProps } from '@mui/material';
import { Avatar as AvatarIcon, Box, Typography } from '@mui/material';
import type { LoggedInUser } from '@packages/profile/getUser';
import { hasNftAvatar } from '@packages/users/hasNftAvatar';
import type { ReactNode } from 'react';
import { memo } from 'react';

import type { InitialAvatarProps } from 'components/common/Avatar';
import Avatar from 'components/common/Avatar';
import { useMemberProfileDialog } from 'components/members/hooks/useMemberProfileDialog';
import { useMembers } from 'hooks/useMembers';

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
        <Box>{props.avatarIcon}</Box>
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

/**
 * @linkToProfile Whether we show a link to user's public profile. Defaults to false.
 */
interface UserDisplayProps extends StyleProps {
  userId?: string;
  showMiniProfile?: boolean;
  user?: LoggedInUser;
  hideIdentity?: boolean;
}

function UserDisplay({ showMiniProfile = false, user, userId, hideIdentity, ...props }: UserDisplayProps) {
  const { showUserProfile } = useMemberProfileDialog();
  const { membersRecord } = useMembers();
  const member = user ?? (userId ? membersRecord[userId] : null);

  if (hideIdentity) {
    return (
      <BaseComponent
        username='Anonymous'
        avatarIcon={
          <AvatarIcon
            sx={{
              width: 20,
              height: 20
            }}
          />
        }
        {...props}
      />
    );
  }

  if (!member) {
    // strip out invalid names
    const { hideName, avatarSize, ...boxProps } = props;
    return (
      <Box display='flex' alignItems='center' gap={1} {...boxProps}>
        <Avatar avatar={null} size='small' />
      </Box>
    );
  }

  const isNft = hasNftAvatar(member);

  return (
    <BaseComponent
      onClick={
        showMiniProfile
          ? () => {
              if (showMiniProfile && userId) {
                showUserProfile(userId);
              }
            }
          : undefined
      }
      username={member.username}
      avatar={member.avatar}
      isNft={isNft}
      {...props}
    />
  );
}

export default memo(UserDisplay);
