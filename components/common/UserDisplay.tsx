import type { BoxProps } from '@mui/material';
import { Box, Typography } from '@mui/material';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import type { ReactNode } from 'react';
import { memo, useMemo } from 'react';

import type { InitialAvatarProps } from 'components/common/Avatar';
import Avatar from 'components/common/Avatar';
import { useMemberProfileDialog } from 'components/members/hooks/useMemberProfileDialog';
import { useMembers } from 'hooks/useMembers';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';
import { randomName } from 'lib/utils/randomName';

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

/**
 * @linkToProfile Whether we show a link to user's public profile. Defaults to false.
 */
interface UserDisplayProps extends StyleProps {
  userId?: string;
  showMiniProfile?: boolean;
  user?: LoggedInUser;
  anonymize?: boolean; // use a fake identity to be anonymous
}

function UserDisplay({ showMiniProfile = false, user, userId, anonymize, ...props }: UserDisplayProps) {
  const { showUserProfile } = useMemberProfileDialog();
  const { membersRecord } = useMembers();
  const member = user ?? (userId ? membersRecord[userId] : null);

  const fakeName = useMemo(() => {
    return randomName();
  }, []);

  if (anonymize) {
    return <BaseComponent username={fakeName} avatar={null} {...props} />;
  }

  if (!member) {
    // strip out invalid names
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
