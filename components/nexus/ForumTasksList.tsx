import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { NotificationType } from '@prisma/client';
import { DateTime } from 'luxon';
import { useEffect } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import UserDisplay from 'components/common/UserDisplay';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import type { ForumTask } from 'lib/forums/getForumNotifications/getForumNotifications';
import { isTruthy } from 'lib/utilities/types';
import type { GetTasksResponse } from 'pages/api/tasks/list';

import { EmptyTaskState } from './components/EmptyTaskState';
import Table from './components/NexusTable';

function ForumTaskRow({
  createdBy,
  createdAt,
  marked,
  commentText,
  postPath,
  spaceDomain,
  spaceName,
  postTitle,
  onClose
}: ForumTask & { marked: boolean; onClose: () => void }) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : null;
  const commentLink = `${baseUrl}/${spaceDomain}/forum/post/${postPath}`;

  return (
    <TableRow>
      <TableCell>
        <Box display='flex'>
          <Badge
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'left'
            }}
            invisible={marked}
            color='error'
            variant='dot'
          >
            {createdBy && (
              <Tooltip title={createdBy.username}>
                <div>
                  <UserDisplay showMiniProfile avatarSize='small' user={createdBy} hideName={true} marginRight='10px' />
                </div>
              </Tooltip>
            )}
            <Link
              href={commentLink}
              variant='body1'
              noWrap
              color='inherit'
              onClick={onClose}
              sx={{
                maxWidth: {
                  xs: '130px',
                  sm: '200px',
                  md: '400px'
                }
              }}
            >
              {commentText}
            </Link>
          </Badge>
        </Box>
      </TableCell>
      <TableCell>
        <Typography noWrap>{spaceName}</Typography>
      </TableCell>
      <TableCell>
        <Link color='inherit' href={commentLink} variant='body1' noWrap onClick={onClose}>
          {postTitle}
        </Link>
      </TableCell>
      <TableCell align='center'>
        <Link color='inherit' href={commentLink} variant='body1' noWrap onClick={onClose}>
          {DateTime.fromISO(createdAt).toRelative({ base: DateTime.now() })}
        </Link>
      </TableCell>
    </TableRow>
  );
}

interface DiscussionTasksListProps {
  tasks: GetTasksResponse | undefined;
  error: any;
  mutateTasks: KeyedMutator<GetTasksResponse>;
}

export default function ForumTasksList({ tasks, error, mutateTasks }: DiscussionTasksListProps) {
  const { onClose } = useSettingsDialog();

  useEffect(() => {
    async function main() {
      if (tasks?.forum && tasks.forum.unmarked.length !== 0) {
        await charmClient.tasks.markTasks(
          tasks.forum.unmarked
            .map((unmarkedComment) => {
              if (unmarkedComment.commentId) {
                return {
                  id: unmarkedComment.commentId,
                  type: 'post_comment' as NotificationType
                };
              } else if (unmarkedComment.mentionId) {
                return {
                  id: unmarkedComment.mentionId,
                  type: 'mention' as NotificationType
                };
              }

              return null;
            })
            .filter(isTruthy)
        );
      }
    }

    main();

    return () => {
      if (tasks?.forum && tasks.forum.unmarked.length !== 0) {
        mutateTasks(
          (_tasks) => {
            const unmarked = _tasks?.forum.unmarked ?? [];
            return _tasks
              ? {
                  ..._tasks,
                  forum: {
                    marked: [...unmarked, ..._tasks.forum.marked],
                    unmarked: []
                  }
                }
              : undefined;
          },
          {
            revalidate: false
          }
        );
      }
    };
  }, [tasks]);

  if (error) {
    return (
      <Box>
        <Alert severity='error'>There was an error. Please try again later!</Alert>
      </Box>
    );
  } else if (!tasks?.forum) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

  const totalMentions = tasks.forum.unmarked.length + tasks.forum.marked.length;

  if (totalMentions === 0) {
    return <EmptyTaskState taskType='forum comments' />;
  }

  return (
    <Box overflow='auto'>
      <Table size='medium' aria-label='Nexus forum table'>
        <TableHead>
          <TableRow>
            <TableCell>Comment</TableCell>
            <TableCell width={200}>Space</TableCell>
            <TableCell width={200}>Post</TableCell>
            <TableCell width={140} align='center'>
              Date
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.forum.unmarked.map((forumTask) => (
            <ForumTaskRow key={forumTask.commentId} {...forumTask} marked={false} onClose={onClose} />
          ))}
          {tasks.forum.marked.map((forumTask) => (
            <ForumTaskRow key={forumTask.commentId} {...forumTask} marked onClose={onClose} />
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
