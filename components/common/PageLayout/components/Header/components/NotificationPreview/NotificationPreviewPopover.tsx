import { Box, Card, Divider, Typography } from '@mui/material';

import useTasks from 'components/nexus/hooks/useTasks';

import { NotificationPreview } from './NotificationPreview';

export function NotificationPreviewPopover({ onSeeAllClick }: { onSeeAllClick: () => void }) {
  const arr = [1, 2, 3, 4, 5];
  const { tasks, gnosisTasks } = useTasks();
  const bounties =
    tasks?.bounties.unmarked.map((b) => ({
      id: b.id + b.eventDate,
      createdAt: b.eventDate,
      spaceName: b.spaceName,
      title: b.pageTitle,
      type: 'bounties'
    })) || [];
  const discussions =
    tasks?.discussions.unmarked.map((d) => ({
      id: d.commentId + d.createdAt,
      createdAt: d.createdAt,
      spaceName: d.spaceName,
      title: d.pageTitle,
      type: 'discussions'
    })) || [];
  const forum =
    tasks?.forum.unmarked.map((f) => ({
      id: f.commentId + f.createdAt,
      createdAt: f.createdAt,
      spaceName: f.spaceName,
      title: f.postTitle,
      type: 'forum'
    })) || [];
  const proposals =
    tasks?.proposals.unmarked.map((p) => ({
      id: p.id,
      createdAt: p.eventDate,
      spaceName: p.spaceName,
      title: p.pageTitle,
      type: 'proposals'
    })) || [];
  const votes =
    tasks?.votes.map((v) => ({
      id: v.id,
      createdAt: v.createdAt,
      spaceName: v.space.name,
      title: v.title,
      type: 'votes'
    })) || [];
  // const gnosis = gnosisTasks?.map((g) => ({
  //   id: g.taskId,
  //   createdAt: g.marked,
  //   spaceName: g.safeName,
  //   title: g.safeName,
  //   type: 'multisig'
  // }));
  const allTasks = [...bounties, ...discussions, ...forum, ...proposals, ...votes];

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
              createdAt={t.createdAt}
              spaceName={t.spaceName}
              title={t.title}
              type={t.type}
            />
            <Divider />
          </>
        ))}
        {arr.map((index) => (
          <>
            <NotificationPreview
              key={index}
              createdAt='12/12/2012'
              spaceName='Space Name'
              title='WWWWWWWWWWW WWWWWWWWWWWWWW'
              type='multisig'
            />
            <Divider />
          </>
        ))}
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
          <Typography variant='body1' fontWeight={600}>
            SEE ALL
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}
