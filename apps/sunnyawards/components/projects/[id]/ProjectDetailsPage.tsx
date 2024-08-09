import 'server-only';

import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import type { ConnectProjectDetails } from '@connect-shared/lib/projects/fetchProject';
import { getSession } from '@connect-shared/lib/session/getSession';
import { Divider, Stack, Typography } from '@mui/material';

import { FarcasterCard } from 'components/common/FarcasterCard';
import { WarpcastLogin } from 'components/common/Warpcast/WarpcastLogin';

import { ProjectDetails } from '../components/ProjectDetails';
import { ProjectHeader } from '../components/ProjectHeader';

export async function ProjectDetailsPage({ project }: { project: ConnectProjectDetails }) {
  const session = await getSession();
  const projectMembers = project.projectMembers;

  const isCurrentUserTeamLead = projectMembers.some((member) => member.teamLead && member.userId === session?.user?.id);

  return (
    <PageWrapper
      bgcolor='transparent'
      header={<ProjectHeader name={project.name} avatar={project.avatar} coverImage={project.coverImage} />}
    >
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
      {!session?.user?.id && (
        <Stack justifyContent='center' alignItems='center'>
          <WarpcastLogin />
        </Stack>
      )}
    </PageWrapper>
  );
}
