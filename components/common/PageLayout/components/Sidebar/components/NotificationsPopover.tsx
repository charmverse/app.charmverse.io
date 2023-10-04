import styled from '@emotion/styled';
import CelebrationIcon from '@mui/icons-material/Celebration';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { Box, Divider, Typography, Badge, Stack, Tooltip } from '@mui/material';
import { Fragment } from 'react';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import MultiTabs from 'components/common/MultiTabs';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useUser } from 'hooks/useUser';
import type { Notification } from 'lib/notifications/interfaces';
import { capitalize } from 'lib/utilities/strings';

import { getNotificationMetadata } from '../../Header/components/NotificationPreview/utils';

const StyledStack = styled(Stack)`
  ${hoverIconsStyle()}
`;

export function NotificationsPopover({ close }: { close: VoidFunction }) {
  const { user } = useUser();
  const {
    data: notifications = [],
    isLoading,
    mutate: mutateNotifications
  } = useSWRImmutable(
    user ? `/notifications/list/${user.id}` : null,
    () => charmClient.notifications.getNotifications(),
    {
      // 10 minutes
      refreshInterval: 1000 * 10 * 60
    }
  );

  const markAsRead = async ({ taskId }: { taskId: string }) => {
    await charmClient.notifications.markNotifications([taskId]);

    mutateNotifications(
      (_notifications) => {
        if (!_notifications) {
          return;
        }

        return _notifications.map((_notification) =>
          _notification.taskId === taskId ? { ..._notification, marked: true } : _notification
        );
      },
      {
        revalidate: false
      }
    );
  };

  return (
    <MultiTabs
      tabs={[
        [
          'Inbox',
          <Box key='Inbox'>
            <LoadingComponent isLoading={isLoading} label='Fetching your notifications' size={24}>
              <Box maxHeight={500} sx={{ overflowY: 'auto', overflowX: 'hidden' }}>
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <Fragment key={notification.taskId}>
                      <NotificationContent
                        notification={notification}
                        markAsRead={markAsRead}
                        onClose={close}
                        archived
                      />
                      <Divider />
                    </Fragment>
                  ))
                ) : (
                  <Box
                    display='flex'
                    justifyContent='center'
                    alignItems='center'
                    flexDirection='row'
                    height='100%'
                    my={2}
                    gap={1}
                  >
                    <Typography variant='h6' color='secondary'>
                      You are up to date!
                    </Typography>
                    <CelebrationIcon color='secondary' fontSize='medium' />
                  </Box>
                )}
              </Box>
            </LoadingComponent>
          </Box>,
          {
            sx: {
              p: 0
            }
          }
        ],
        ['Archived', <Box key='Archived'>Archived</Box>]
      ]}
    />
  );
}

export function NotificationContent({
  archived,
  notification,
  markAsRead,
  onClose,
  large,
  unmarked
}: {
  notification: Notification;
  markAsRead: (arg: { taskId: string }) => Promise<void>;
  onClose: VoidFunction;
  large?: boolean;
  unmarked?: boolean;
  archived?: boolean;
}) {
  const { group, type, spaceName, createdBy, taskId, createdAt } = notification;
  const { href, content } = getNotificationMetadata(notification);
  const { formatDate, formatTime } = useDateFormatter();
  const date = new Date(createdAt);
  const todaysDate = new Date();
  const isDateEqual = date.setHours(0, 0, 0, 0) === todaysDate.setHours(0, 0, 0, 0);
  const notificationDate = isDateEqual ? `Today at ${formatTime(createdAt)}` : formatDate(createdAt);

  const isSmallScreen = useSmallScreen();

  return (
    <Link
      data-test={`goto-${taskId}`}
      color='inherit'
      href={href}
      onClick={() => {
        markAsRead({ taskId });
        onClose();
      }}
    >
      <StyledStack
        sx={{
          '&:hover': {
            cursor: 'pointer',
            background: (theme) => theme.palette.background.light
          }
        }}
        display='flex'
        alignItems='center'
        justifyContent='space-between'
        gap={2}
        pl={2}
        pr={2}
        py={1.5}
      >
        <Box display='flex' justifyContent='space-between' width='100%'>
          <Box display='flex' alignItems='flex-start' mr={1.25} pt={0.5}>
            <Badge
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left'
              }}
              invisible={!unmarked}
              color='error'
              variant='dot'
            >
              <Avatar size={large ? 'medium' : 'small'} name={createdBy.username} avatar={createdBy.avatar} />
            </Badge>
          </Box>
          <Box overflow='hidden' display='flex' flexDirection='column' flex={1} gap={large ? 0.5 : 0}>
            <Stack direction='row' justifyContent='space-between' width='100%'>
              <Box display='flex' pl={0.2} minWidth={0}>
                <Box minWidth={0}>
                  <Typography
                    whiteSpace='nowrap'
                    overflow='hidden'
                    textOverflow='ellipsis'
                    variant='subtitle2'
                  >{`${spaceName}`}</Typography>
                </Box>
                &nbsp;
                <Box whiteSpace='nowrap'>
                  <Typography variant='subtitle2' fontWeight='bold'>
                    {capitalize(group)}
                  </Typography>
                </Box>
                &nbsp;
                <Typography whiteSpace='nowrap' overflow='hidden' textOverflow='ellipsis' variant='subtitle2'>
                  {!isSmallScreen && notificationDate}
                </Typography>
              </Box>
              <Stack className='icons' flexDirection='row' gap={0.5}>
                <Tooltip title={`Mark this notification as ${!unmarked ? 'read' : 'unread'}`}>
                  {!unmarked ? (
                    <CheckBoxOutlineBlankIcon fontSize='small' color='secondary' />
                  ) : (
                    <CheckBoxIcon fontSize='small' color='secondary' />
                  )}
                </Tooltip>
                <Tooltip title='Archive this notification'>
                  <Inventory2OutlinedIcon fontSize='small' color='secondary' />
                </Tooltip>
              </Stack>
            </Stack>

            <Typography
              variant='subtitle1'
              sx={{
                display: '-webkit-box',
                overflow: 'hidden',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2
              }}
            >
              {content}
            </Typography>
          </Box>
        </Box>
      </StyledStack>
    </Link>
  );
}
