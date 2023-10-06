import styled from '@emotion/styled';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import QueryBuilderOutlinedIcon from '@mui/icons-material/QueryBuilderOutlined';
import { Divider, Typography, Badge, Stack, Tooltip, Popover, Card, IconButton } from '@mui/material';
import Box from '@mui/material/Box';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { Fragment, useMemo, useState } from 'react';
import { IoFilterCircleOutline } from 'react-icons/io5';
import type { KeyedMutator } from 'swr';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import { Button } from 'components/common/Button';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import MultiTabs from 'components/common/MultiTabs';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useUser } from 'hooks/useUser';
import { getNotificationMetadata } from 'lib/notifications/getNotificationMetadata';
import type { Notification } from 'lib/notifications/interfaces';
import type { MarkNotifications } from 'lib/notifications/markNotifications';

import { sidebarItemStyles } from './SidebarButton';

const StyledStack = styled(Stack)`
  ${hoverIconsStyle()}
`;

const StyledSidebarBox = styled(Box)`
  cursor: pointer;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  ${sidebarItemStyles}
`;

const NotificationCountBox = styled(Box)`
  background-color: ${({ theme }) => theme.palette.error.main};
  color: white;
  width: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 20%;
  font-weight: semi-bold;
  font-size: 12px;
`;

export function NotificationUpdates() {
  const { user } = useUser();

  const notificationPopupState = usePopupState({ variant: 'popover', popupId: 'notifications-menu' });
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

  const unreadNotifications = notifications.filter((notification) => !notification.read);

  return (
    <Box>
      <StyledSidebarBox onClick={notificationPopupState.open}>
        <Stack flexDirection='row'>
          <QueryBuilderOutlinedIcon color='secondary' fontSize='small' />
          Updates
        </Stack>
        {unreadNotifications.length !== 0 && <NotificationCountBox>{unreadNotifications.length}</NotificationCountBox>}
      </StyledSidebarBox>
      <Popover
        {...bindPopover(notificationPopupState)}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'top'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        PaperProps={{
          sx: {
            width: 600
          }
        }}
      >
        <NotificationsPopover
          notifications={notifications}
          mutateNotifications={mutateNotifications}
          isLoading={isLoading}
          close={notificationPopupState.close}
        />
      </Popover>
    </Box>
  );
}

export function NotificationsPopover({
  close,
  isLoading,
  mutateNotifications,
  notifications
}: {
  close: VoidFunction;
  notifications: Notification[];
  mutateNotifications: KeyedMutator<Notification[]>;
  isLoading: boolean;
}) {
  const [inboxState, setInboxState] = useState<'unread' | 'unarchived'>('unarchived');
  const [activeTab, setActiveState] = useState<'Inbox' | 'Archived'>('Inbox');
  const { archivedNotifications, unArchivedNotifications, unreadNotifications, readUnArchivedNotifications } =
    useMemo(() => {
      const _unArchivedNotifications: Notification[] = [];
      const _archivedNotifications: Notification[] = [];
      const _readNotifications: Notification[] = [];
      const _unreadNotifications: Notification[] = [];
      const _readUnArchivedNotifications: Notification[] = [];
      notifications.forEach((notification) => {
        if (notification.archived) {
          _archivedNotifications.push(notification);
        } else {
          _unArchivedNotifications.push(notification);
        }

        if (notification.read) {
          _readNotifications.push(notification);
        } else {
          _unreadNotifications.push(notification);
        }

        if (notification.read && !notification.archived) {
          _readUnArchivedNotifications.push(notification);
        }
      });
      return {
        unArchivedNotifications: _unArchivedNotifications,
        archivedNotifications: _archivedNotifications,
        readNotifications: _readNotifications,
        unreadNotifications: _unreadNotifications,
        readUnArchivedNotifications: _readUnArchivedNotifications
      };
    }, [notifications]);

  const markNotifications = async (payload: MarkNotifications) => {
    await charmClient.notifications.markNotifications(payload);

    mutateNotifications(
      (_notifications) => {
        if (!_notifications) {
          return;
        }

        const { state } = payload;

        return _notifications.map((_notification) =>
          payload.ids.includes(_notification.taskId)
            ? {
                ..._notification,
                read: state === 'read' || state === 'archived' ? true : state === 'unread' ? false : _notification.read,
                archived: state === 'archived' ? true : state === 'unarchived' ? false : _notification.archived
              }
            : _notification
        );
      },
      {
        revalidate: false
      }
    );
  };

  const markAllReadButtonDisabled = unreadNotifications.length === 0 || isLoading;
  const archiveAllButtonDisabled = readUnArchivedNotifications.length === 0 || isLoading;
  const targetNotifications =
    activeTab === 'Inbox'
      ? inboxState === 'unarchived'
        ? unArchivedNotifications
        : unreadNotifications
      : archivedNotifications;

  return (
    <MultiTabs
      endAdornmentComponent={
        activeTab === 'Inbox' && (
          <Tooltip
            title={
              unArchivedNotifications.length === 0
                ? ''
                : inboxState === 'unread'
                ? 'Show all notifications'
                : 'Show unread notifications only'
            }
          >
            <Box
              sx={{
                px: 1
              }}
            >
              <IconButton
                disabled={unArchivedNotifications.length === 0}
                color={inboxState === 'unread' ? 'primary' : 'secondary'}
                onClick={() => {
                  setInboxState(inboxState === 'unarchived' ? 'unread' : 'unarchived');
                }}
              >
                <IoFilterCircleOutline fontSize={18} />
              </IconButton>
            </Box>
          </Tooltip>
        )
      }
      activeTab={activeTab === 'Inbox' ? 0 : 1}
      setActiveTab={(tabIndex) => {
        setActiveState(tabIndex === 0 ? 'Inbox' : 'Archived');
        if (tabIndex === 1 && inboxState === 'unread') {
          setInboxState('unarchived');
        }
      }}
      tabs={[
        [
          'Inbox',
          <Box key='Inbox'>
            {targetNotifications.length !== 0 && (
              <Stack flexDirection='row' gap={1} px={2} pt={2} pb={1}>
                <div
                  style={{
                    width: '100%'
                  }}
                >
                  <Button
                    disabledTooltip='All notifications have been read as read.'
                    variant='outlined'
                    color={markAllReadButtonDisabled ? 'secondary' : 'primary'}
                    fullWidth
                    disabled={markAllReadButtonDisabled}
                    onClick={() => {
                      if (!markAllReadButtonDisabled) {
                        markNotifications({
                          state: 'read',
                          ids: unreadNotifications.map((notification) => notification.taskId)
                        });
                      }
                    }}
                  >
                    Mark all as read
                  </Button>
                </div>
                <div style={{ width: '100%' }}>
                  <Button
                    onClick={() => {
                      if (!archiveAllButtonDisabled) {
                        markNotifications({
                          state: 'archived',
                          ids: readUnArchivedNotifications.map((notification) => notification.taskId)
                        });
                      }
                    }}
                    disabledTooltip='All read notifications have been archived.'
                    variant='outlined'
                    color={archiveAllButtonDisabled ? 'secondary' : 'primary'}
                    fullWidth
                    disabled={archiveAllButtonDisabled}
                  >
                    {unreadNotifications.length === 0 ? 'Archive all' : 'Archive read'}
                  </Button>
                </div>
              </Stack>
            )}
            {inboxState === 'unarchived' ? (
              <LoadingComponent isLoading={isLoading} label='Fetching your notifications' minHeight={250} size={24}>
                <Box maxHeight={500} sx={{ overflowY: 'auto' }}>
                  {targetNotifications.length > 0 ? (
                    targetNotifications.map((notification) => (
                      <Fragment key={notification.taskId}>
                        <NotificationContent
                          notification={notification}
                          markNotifications={markNotifications}
                          onClose={close}
                        />
                        <Divider />
                      </Fragment>
                    ))
                  ) : (
                    <Stack justifyContent='center' alignItems='center' height='100%' my={2} gap={1} py={2} px={5}>
                      <InboxOutlinedIcon sx={{ fontSize: 48 }} color='secondary' />
                      <Typography color='secondary' fontWeight='bold' fontSize={16}>
                        You're all caught up
                      </Typography>
                      <Typography fontSize={14} color='secondary' textAlign='center'>
                        You'll be notified here for any updates.
                      </Typography>
                    </Stack>
                  )}
                </Box>
              </LoadingComponent>
            ) : (
              <LoadingComponent isLoading={isLoading} label='Fetching your notifications' minHeight={250} size={24}>
                <Box maxHeight={500} sx={{ overflowY: 'auto' }}>
                  {targetNotifications.length > 0 ? (
                    targetNotifications.map((notification) => (
                      <Fragment key={notification.taskId}>
                        <NotificationContent
                          notification={notification}
                          markNotifications={markNotifications}
                          onClose={close}
                        />
                        <Divider />
                      </Fragment>
                    ))
                  ) : (
                    <Stack justifyContent='center' alignItems='center' height='100%' my={2} gap={1} py={2} px={5}>
                      <CheckOutlinedIcon sx={{ fontSize: 48 }} color='secondary' />
                      <Typography color='secondary' fontWeight='bold' fontSize={16}>
                        You've read everything
                      </Typography>
                      <Typography fontSize={14} color='secondary' textAlign='center'>
                        You have more notifications in your inbox.
                      </Typography>
                      <Button
                        variant='text'
                        color='primary'
                        size='small'
                        onClick={() => {
                          setInboxState('unarchived');
                        }}
                      >
                        See all
                      </Button>
                    </Stack>
                  )}
                </Box>
              </LoadingComponent>
            )}
          </Box>,
          {
            sx: {
              p: 0
            }
          }
        ],
        [
          'Archived',
          <Box key='Archived'>
            <LoadingComponent
              isLoading={isLoading}
              label='Fetching your archived notifications'
              minHeight={250}
              size={24}
            >
              <Box maxHeight={500} sx={{ overflowY: 'auto' }}>
                {archivedNotifications.length > 0 ? (
                  archivedNotifications.map((notification) => (
                    <Fragment key={notification.taskId}>
                      <NotificationContent
                        notification={notification}
                        markNotifications={markNotifications}
                        onClose={close}
                      />
                      <Divider />
                    </Fragment>
                  ))
                ) : (
                  <Stack justifyContent='center' alignItems='center' height='100%' my={2} gap={1} py={2} px={5}>
                    <InboxOutlinedIcon sx={{ fontSize: 48 }} color='secondary' />
                    <Typography color='secondary' fontWeight='bold' fontSize={16}>
                      No archived updates
                    </Typography>
                    <Typography fontSize={14} color='secondary' textAlign='center'>
                      Any Inbox updates you archived will show up here.
                    </Typography>
                  </Stack>
                )}
              </Box>
            </LoadingComponent>
          </Box>,
          {
            sx: {
              p: 0
            }
          }
        ]
      ]}
    />
  );
}

export function NotificationContent({
  notification,
  markNotifications,
  onClose
}: {
  notification: Notification;
  markNotifications: (payload: MarkNotifications) => Promise<void>;
  onClose: VoidFunction;
}) {
  const read = notification.read;
  const archived = notification.archived;
  const { spaceName, createdBy, taskId, createdAt } = notification;
  const { href, content, pageTitle } = getNotificationMetadata(notification);
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
        if (!read) {
          markNotifications({ ids: [taskId], state: 'read' });
        }
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
              invisible={read}
              color='error'
              variant='dot'
            >
              <Avatar size='small' name={createdBy.username} avatar={createdBy.avatar} />
            </Badge>
          </Box>
          <Box overflow='hidden' display='flex' flexDirection='column' flex={1}>
            <Stack direction='row' justifyContent='space-between'>
              <Stack direction='row' gap={1} alignItems='center'>
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
                <Typography whiteSpace='nowrap' overflow='hidden' textOverflow='ellipsis' variant='subtitle2'>
                  {!isSmallScreen && notificationDate}
                </Typography>
              </Stack>
              {!archived && (
                <Card
                  className='icons'
                  sx={{ px: 0.5, pt: 0.5, flexDirection: 'row', gap: 0.5, display: 'flex' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <Tooltip title={`Mark this notification as ${read ? 'unread' : 'read'}`}>
                    <div
                      onClick={(e) => {
                        markNotifications({ ids: [taskId], state: read ? 'unread' : 'read' });
                      }}
                    >
                      {!read ? (
                        <CheckBoxOutlineBlankIcon fontSize='small' color='secondary' />
                      ) : (
                        <CheckBoxIcon fontSize='small' color='secondary' />
                      )}
                    </div>
                  </Tooltip>
                  <Tooltip title='Archive this notification'>
                    <div
                      onClick={(e) => {
                        markNotifications({ ids: [taskId], state: 'archived' });
                      }}
                    >
                      <Inventory2OutlinedIcon fontSize='small' color='secondary' />
                    </div>
                  </Tooltip>
                </Card>
              )}
            </Stack>
            <Typography mb={0.5} whiteSpace='nowrap' overflow='hidden' textOverflow='ellipsis' fontWeight='bold'>
              {pageTitle}
            </Typography>
            <Typography whiteSpace='nowrap' overflow='hidden' textOverflow='ellipsis' variant='subtitle2'>
              {spaceName}
            </Typography>
            {archived && (
              <Button
                sx={{
                  width: 'fit-content',
                  alignSelf: 'flex-start'
                }}
                color='secondary'
                variant='text'
                onClick={(e: any) => {
                  e.stopPropagation();
                  e.preventDefault();
                  markNotifications({ ids: [taskId], state: 'unarchived' });
                }}
                size='small'
              >
                Unarchive
              </Button>
            )}
          </Box>
        </Box>
      </StyledStack>
    </Link>
  );
}
