import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PersonIcon from '@mui/icons-material/Person';
import QueryBuilderOutlinedIcon from '@mui/icons-material/QueryBuilderOutlined';
import { Badge, Card, Divider, IconButton, Popover, Stack, Tooltip, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { Fragment, useMemo, useState } from 'react';
import { FiInbox } from 'react-icons/fi';
import { IoFilterCircleOutline } from 'react-icons/io5';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import { Button } from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import MultiTabs from 'components/common/MultiTabs';
import { useNotifications } from 'components/nexus/hooks/useNotifications';
import { useDateFormatter } from 'hooks/useDateFormatter';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useMembers } from 'hooks/useMembers';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { useUser } from 'hooks/useUser';
import type { Member } from '@packages/lib/members/interfaces';
import { getNotificationMetadata } from '@packages/lib/notifications/getNotificationMetadata';
import type { Notification } from '@packages/lib/notifications/interfaces';
import type { MarkNotifications } from '@packages/lib/notifications/markNotifications';

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

export const NotificationCountBox = styled(Box)`
  background-color: ${({ theme }) => theme.palette.error.main};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  font-size: 10px;
  text-align: center;
  font-weight: 600;
  border-radius: 3px;
  color: white;
`;

export function NotificationUpdates({ closeSidebar }: { closeSidebar?: VoidFunction }) {
  const notificationPopupState = usePopupState({ variant: 'popover', popupId: 'notifications-menu' });
  const {
    currentSpaceNotifications,
    currentSpaceUnreadNotifications,
    isLoading,
    mutate: mutateNotifications
  } = useNotifications();

  function close() {
    notificationPopupState.close();
    closeSidebar?.();
  }

  return (
    <Box>
      <StyledSidebarBox onClick={notificationPopupState.open}>
        <Stack flexDirection='row' alignItems='center'>
          <QueryBuilderOutlinedIcon color='secondary' fontSize='small' />
          Updates
        </Stack>
        {currentSpaceUnreadNotifications.length !== 0 && (
          <NotificationCountBox>{currentSpaceUnreadNotifications.length}</NotificationCountBox>
        )}
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
          notifications={currentSpaceNotifications}
          mutateNotifications={mutateNotifications}
          isLoading={isLoading}
          close={close}
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
  const { user } = useUser();

  const { membersRecord } = useMembers();
  const currentMember = user?.id ? membersRecord[user.id] : undefined;
  const theme = useTheme();
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
          payload.ids.includes(_notification.id)
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
                          ids: unreadNotifications.map((notification) => notification.id)
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
                          ids: readUnArchivedNotifications.map((notification) => notification.id)
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
                    targetNotifications.map((notification) => {
                      const notificationMember = membersRecord[notification.createdBy.id];
                      return (
                        <Fragment key={notification.id}>
                          <NotificationContent
                            notification={notification}
                            markNotifications={markNotifications}
                            user={currentMember}
                            onClose={close}
                            actorUsername={notificationMember?.username ?? notification.createdBy.username}
                          />
                          <Divider />
                        </Fragment>
                      );
                    })
                  ) : (
                    <Stack justifyContent='center' alignItems='center' height='100%' my={2} gap={1} py={2} px={5}>
                      <FiInbox style={{ fontSize: 48, color: theme.palette.secondary.light }} />
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
                    targetNotifications.map((notification) => {
                      const notificationMember = membersRecord[notification.createdBy.id];
                      return (
                        <Fragment key={notification.id}>
                          <NotificationContent
                            notification={notification}
                            markNotifications={markNotifications}
                            user={currentMember}
                            onClose={close}
                            actorUsername={notificationMember?.username ?? notification.createdBy.username}
                          />
                          <Divider />
                        </Fragment>
                      );
                    })
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
                  archivedNotifications.map((notification) => {
                    const notificationMember = membersRecord[notification.createdBy.id];
                    return (
                      <Fragment key={notification.id}>
                        <NotificationContent
                          user={currentMember}
                          actorUsername={notificationMember?.username ?? notification.createdBy.username}
                          notification={notification}
                          markNotifications={markNotifications}
                          onClose={close}
                        />
                        <Divider />
                      </Fragment>
                    );
                  })
                ) : (
                  <Stack justifyContent='center' alignItems='center' height='100%' my={2} gap={1} py={2} px={5}>
                    <FiInbox style={{ fontSize: 48, color: theme.palette.secondary.light }} />
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
  onClose,
  actorUsername,
  user
}: {
  actorUsername: string;
  notification: Notification;
  markNotifications: (payload: MarkNotifications) => Promise<void>;
  onClose: VoidFunction;
  user?: Member;
}) {
  const { features } = useSpaceFeatures();
  const read = notification.read;
  const archived = notification.archived;
  const { spaceName, createdBy, id, createdAt, spaceDomain } = notification;
  const { href, content, pageTitle } = getNotificationMetadata({
    notification,
    actorUsername,
    spaceFeatures: features
  });
  const notificationContent = notification.group === 'document' ? notification.content : null;
  const { formatDate, formatTime } = useDateFormatter();
  const date = new Date(createdAt);
  const todaysDate = new Date();
  const isDateEqual = date.setHours(0, 0, 0, 0) === todaysDate.setHours(0, 0, 0, 0);
  const notificationDate = isDateEqual
    ? `Today at ${formatTime(createdAt)}`
    : formatDate(createdAt, { withYear: false });
  const isSmallScreen = useSmallScreen();

  return (
    <Link
      data-test={`goto-${id}`}
      color='inherit'
      href={href}
      space={{ domain: spaceDomain, customDomain: null }}
      onClick={() => {
        if (!read) {
          markNotifications({ ids: [id], state: 'read' });
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
        pl={3}
        pr={3}
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
              <Avatar size='small' name={actorUsername} avatar={createdBy.avatar} />
            </Badge>
          </Box>
          <Box overflow='hidden' display='flex' flexDirection='column' flex={1}>
            <Stack direction='row' justifyContent='space-between' alignItems='center'>
              <Stack direction='row' gap={1} alignItems='center'>
                <Typography
                  sx={{
                    fontSize: 14,
                    display: '-webkit-box',
                    overflow: 'hidden',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2
                  }}
                >
                  {content}
                </Typography>
                {!isSmallScreen && (
                  <Typography whiteSpace='nowrap' overflow='hidden' textOverflow='ellipsis' variant='subtitle2'>
                    {notificationDate}
                  </Typography>
                )}
              </Stack>
              {!archived && (
                <Card
                  className='icons'
                  sx={{
                    px: 0.5,
                    pt: 0.5,
                    minWidth: 52.5,
                    ml: 1,
                    height: 'fit-content',
                    flexDirection: 'row',
                    gap: 0.5,
                    display: 'flex'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <Tooltip title={`Mark this notification as ${read ? 'unread' : 'read'}`}>
                    <div
                      onClick={(e) => {
                        markNotifications({ ids: [id], state: read ? 'unread' : 'read' });
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
                        markNotifications({ ids: [id], state: 'archived' });
                      }}
                    >
                      <Inventory2OutlinedIcon fontSize='small' color='secondary' />
                    </div>
                  </Tooltip>
                </Card>
              )}
            </Stack>
            <Typography whiteSpace='nowrap' overflow='hidden' textOverflow='ellipsis' variant='subtitle2' fontSize={12}>
              {spaceName}
            </Typography>
            <Typography
              mb={0.5}
              fontSize={14}
              whiteSpace='nowrap'
              overflow='hidden'
              textOverflow='ellipsis'
              fontWeight='bold'
            >
              {pageTitle}
            </Typography>
            {notificationContent && (
              <CharmEditor
                isContentControlled
                disableRowHandles
                content={notificationContent}
                readOnly
                style={{
                  left: 0,
                  padding: 0,
                  fontSize: '14px'
                }}
              />
            )}
            {notification.type === 'person_assigned' && notification.personProperty ? (
              <Stack my={1} gap={0.5}>
                <Stack flexDirection='row' gap={0.5} alignItems='center'>
                  <PersonIcon fontSize='small' />
                  <Typography
                    whiteSpace='nowrap'
                    overflow='hidden'
                    textOverflow='ellipsis'
                    variant='subtitle2'
                    fontSize={12}
                  >
                    {notification.personProperty.name}
                  </Typography>
                </Stack>
                <Stack flexDirection='row' gap={1}>
                  <Avatar size='xSmall' name={user?.username} avatar={user?.avatar} />
                  <Typography
                    whiteSpace='nowrap'
                    overflow='hidden'
                    textOverflow='ellipsis'
                    variant='caption'
                    fontSize={12}
                  >
                    {user?.username}
                  </Typography>
                </Stack>
              </Stack>
            ) : null}
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
                  markNotifications({ ids: [id], state: 'unarchived' });
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
