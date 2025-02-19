import 'server-only';

import { Divider, Stack, Typography } from '@mui/material';
import { PageWrapper } from '@packages/connect-shared/components/common/PageWrapper';
import type { ConnectProjectDetails } from '@packages/connect-shared/lib/projects/findProject';
import { getSession } from '@packages/connect-shared/lib/session/getSession';

import { FarcasterCard } from 'components/common/FarcasterCard';

import { JoinTheSunnysBanner } from './components/JoinTheSunnysBanner';
import { ProjectDetails } from './components/ProjectDetails';
import { ProjectHeader } from './components/ProjectHeader';

export async function ProjectDetailsPage({ project }: { project: ConnectProjectDetails }) {
  const session = await getSession();
  const projectMembers = project.projectMembers;

  const isCurrentUserTeamLead =
    projectMembers.some((member) => member.teamLead && member.userId === session?.user?.id) ||
    project.createdBy === session.user?.id;

  return (
    <PageWrapper
      header={<ProjectHeader name={project.name} avatar={project.avatar} coverImage={project.coverImage} />}
      footer={!session?.user?.id && <JoinTheSunnysBanner />}
    >
      {/** Edit button disabled as sunny awards submissions are suspended now */}
      <ProjectDetails project={project} showEditButton={isCurrentUserTeamLead} />
      <Divider sx={{ my: 2 }} />
      <Typography variant='h6'>Members</Typography>
      <Stack gap={1} mb={2}>
        {projectMembers.map((member) => (
          <FarcasterCard
            fid={member.farcasterUser.fid}
            key={member.farcasterUser.fid}
            name={member.farcasterUser.displayName}
            username={member.farcasterUser.username}
            avatar={member.farcasterUser.pfpUrl}
            bio={member.farcasterUser.bio}
            isCurrentUser={member.userId === session?.user?.id}
            enableLink
          />
        ))}
      </Stack>
    </PageWrapper>
  );
}
