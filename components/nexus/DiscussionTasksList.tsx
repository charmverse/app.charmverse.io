import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { DateTime } from 'luxon';
import { useEffect, useMemo } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import UserDisplay from 'components/common/UserDisplay';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import type { DiscussionTask } from 'lib/discussion/interfaces';
import type { GetTasksResponse } from 'pages/api/tasks/list';

import { EmptyTaskState } from './components/EmptyTaskState';
import Table from './components/NexusTable';

function DiscussionTaskRow({
  createdAt,
  marked,
  pagePath,
  spaceDomain,
  spaceName,
  pageTitle,
  mentionId,
  createdBy,
  text,
  bountyId,
  type,
  commentId,
  onClose
}: DiscussionTask & { marked: boolean; onClose: () => void }) {
  const { discussionLink, discussionTitle } = useMemo(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : null;

    if (type === 'bounty' && bountyId) {
      return {
        discussionLink: `${baseUrl}/${spaceDomain}/bounties?bountyId=${bountyId}`,
        discussionTitle: `${pageTitle}`
      };
    } else {
      return {
        discussionLink: `${baseUrl}/${spaceDomain}/${pagePath}?${
          commentId ? `commentId=${commentId}` : `mentionId=${mentionId}`
        }`,
        discussionTitle: `${pageTitle}`
      };
    }
  }, [type, bountyId, spaceDomain, pageTitle, pagePath, commentId, mentionId]);

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
              href={discussionLink}
              variant='body1'
              noWrap
              color='inherit'
              sx={{
                maxWidth: {
                  xs: '130px',
                  sm: '200px',
                  md: '400px'
                }
              }}
            >
              {text}
            </Link>
          </Badge>
        </Box>
      </TableCell>
      <TableCell>
        <Typography noWrap>{spaceName}</Typography>
      </TableCell>
      <TableCell>
        <Link color='inherit' href={discussionLink} variant='body1' noWrap onClick={onClose}>
          {discussionTitle}
        </Link>
      </TableCell>
      <TableCell align='center'>
        <Link color='inherit' href={discussionLink} variant='body1' noWrap onClick={onClose}>
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
  includedDiscussions?: ('page' | 'bounty' | 'proposal')[];
}

export default function DiscussionTasksList({
  includedDiscussions = [],
  tasks,
  error,
  mutateTasks
}: DiscussionTasksListProps) {
  const { onClose } = useSettingsDialog();

  const [markedDiscussions, unmarkedDiscussions, unmarkedSkippedDiscussions] = useMemo(() => {
    const _markedDiscussions: DiscussionTask[] = [];
    const _unmarkedDiscussions: DiscussionTask[] = [];
    const _unmarkedSkippedDiscussions: DiscussionTask[] = [];

    (tasks?.discussions ? tasks.discussions.marked : []).forEach((discussion) => {
      if (includedDiscussions.includes(discussion.type)) {
        _markedDiscussions.push(discussion);
      }
    });
    (tasks?.discussions ? tasks.discussions.unmarked : []).forEach((discussion) => {
      if (includedDiscussions.includes(discussion.type)) {
        _unmarkedDiscussions.push(discussion);
      } else {
        _unmarkedSkippedDiscussions.push(discussion);
      }
    });

    return [_markedDiscussions, _unmarkedDiscussions, _unmarkedSkippedDiscussions] as const;
  }, [tasks?.discussions]);

  useEffect(() => {
    async function main() {
      if (unmarkedDiscussions.length !== 0) {
        await charmClient.tasks.markTasks(
          unmarkedDiscussions.map((unmarkedDiscussion) => ({
            id: unmarkedDiscussion.mentionId ?? unmarkedDiscussion.commentId ?? '',
            type: 'mention'
          }))
        );
      }
    }

    main();

    return () => {
      if (unmarkedDiscussions.length !== 0) {
        mutateTasks(
          (_tasks) => {
            return _tasks
              ? {
                  ..._tasks,
                  discussions: {
                    marked: [...unmarkedDiscussions, ...markedDiscussions],
                    unmarked: [...unmarkedSkippedDiscussions]
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
  }, [markedDiscussions, unmarkedDiscussions, unmarkedSkippedDiscussions]);

  if (error) {
    return (
      <Box>
        <Alert severity='error'>There was an error. Please try again later!</Alert>
      </Box>
    );
  } else if (!tasks?.discussions) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

  const totalMentions = (unmarkedDiscussions.length ?? 0) + (markedDiscussions.length ?? 0);

  if (totalMentions === 0) {
    return <EmptyTaskState taskType='discussions' />;
  }

  return (
    <Box overflow='auto'>
      <Table size='medium' aria-label='Nexus discussions table'>
        <TableHead>
          <TableRow>
            <TableCell>Comment</TableCell>
            <TableCell width={200}>Space</TableCell>
            <TableCell width={200}>Page</TableCell>
            <TableCell width={140} align='center'>
              Date
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {unmarkedDiscussions.map((discussionTask) => (
            <DiscussionTaskRow
              key={discussionTask.commentId ?? discussionTask.mentionId ?? ''}
              {...discussionTask}
              marked={false}
              onClose={onClose}
            />
          ))}
          {markedDiscussions.map((discussionTask) => (
            <DiscussionTaskRow
              key={discussionTask.commentId ?? discussionTask.mentionId ?? ''}
              {...discussionTask}
              marked
              onClose={onClose}
            />
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
