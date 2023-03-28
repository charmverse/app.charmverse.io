import { Box, Card, Divider, Typography } from '@mui/material';
import type { NotificationType } from '@prisma/client';

import useTasks from 'components/nexus/hooks/useTasks';
import type { NotificationGroupType } from 'lib/notifications/interfaces';

import { NotificationPreview } from './NotificationPreview';

export function NotificationPreviewPopover({ onSeeAllClick }: { onSeeAllClick: () => void }) {
  const { tasks, gnosisTasks } = useTasks();

  // const bounties =
  //   tasks?.bounties.unmarked.map((b) => ({
  //     id: b.id,
  //     createdAt: b.eventDate,
  //     spaceName: b.spaceName,
  //     title: b.pageTitle,
  //     groupType: 'bounties' as NotificationGroupType,
  //     type: 'bounty' as NotificationType
  //   })) || [];
  const discussions =
    tasks?.discussions.unmarked.map((d) => ({
      id: d.taskId,
      createdAt: d.createdAt,
      createdBy: d.createdBy,
      spaceName: d.spaceName,
      title: d.pageTitle,
      groupType: 'discussions' as NotificationGroupType,
      type: 'mention' as NotificationType
    })) || [];
  const forum =
    tasks?.forum.unmarked.map((f) => ({
      id: f.taskId,
      createdAt: f.createdAt,
      createdBy: f.createdBy,
      spaceName: f.spaceName,
      title: f.postTitle,
      groupType: 'forum' as NotificationGroupType,
      type: 'forum' as NotificationType
    })) || [];
  const proposals =
    tasks?.proposals.unmarked.map((p) => ({
      id: p.id,
      createdAt: p.eventDate,
      createdBy: p.createdBy,
      spaceName: p.spaceName,
      title: p.pageTitle,
      groupType: 'proposals' as NotificationGroupType,
      type: 'proposal' as NotificationType
    })) || [];
  const votes =
    tasks?.votes.unmarked.map((v) => ({
      id: v.id,
      createdAt: v.createdAt,
      createdBy: v.createdBy,
      spaceName: v.space.name,
      title: v.title,
      groupType: 'votes' as NotificationGroupType,
      type: 'vote' as NotificationType
    })) || [];
  // const gnosis = gnosisTasks?.map((g) => ({
  //   id: g.taskId,
  //   createdAt: g.marked,
  //   spaceName: g.safeName,
  //   title: g.safeName,
  //   type: 'Multisig'
  // }));
  const allTasks = [...discussions, ...forum, ...proposals, ...votes];

  return (
    <Box>
      <Card>
        <Typography fontWeight={600} p={2}>
          Notifications
        </Typography>
      </Card>
      <Divider />
      <Box height={400} sx={{ overflowY: 'auto', overflowX: 'hidden' }}>
        {allTasks.map((t) => (
          <>
            <NotificationPreview
              key={t.id}
              id={t.id}
              createdAt={t.createdAt}
              spaceName={t.spaceName}
              title={t.title}
              type={t.type}
              groupType={t.groupType}
              createdBy={t.createdBy}
            />
            <Divider />
          </>
        ))}
        {/* {arr.map((index) => (
          <>
            <NotificationPreview
              key={index}
              id={index.toString()}
              createdAt='12/12/2012'
              spaceName='Space Name WWWWWWWWWWW '
              title='WWWWWW WWWWWssc vbcvdfgd fgdfg gdfggdfgdd bcbbss '
              type='Multisig'
              createdBy={null}
            />
            <Divider />
          </>
        ))} */}
      </Box>
      <Card>
        <Box
          onClick={onSeeAllClick}
          display='flex'
          alignItems='center'
          justifyContent='center'
          sx={{ cursor: 'pointer' }}
          p={2}
        >
          <Typography variant='body1' color='primary' fontWeight={600}>
            See All Notifications
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}
