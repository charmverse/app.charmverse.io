import 'server-only';

import { FarcasterCard } from '@connect/components/common/FarcasterCard';
import { getCurrentUser } from '@connect/lib/actions/getCurrentUser';
import type { ConnectProjectDetails } from '@connect/lib/projects/fetchProject';
import { Divider, Stack, Typography } from '@mui/material';

import { PageWrapper } from '../../common/PageWrapper';
import { ProjectDetails } from '../components/ProjectDetails';
import { ProjectHeader } from '../components/ProjectHeader';

export async function ProjectDetailsPage({ project }: { project?: ConnectProjectDetails | null }) {
  const currentUser = await getCurrentUser({});
  if (!project || !currentUser?.data) {
    return (
      <PageWrapper>
        <Typography mt={5} p={2} variant='h6'>
          Project not found
        </Typography>
      </PageWrapper>
    );
  }

  const isCurrentUserTeamLead = project.projectMembers.some(
    (member) => member.teamLead && member.userId === currentUser.data?.id
  );

  return (
    <PageWrapper header={<ProjectHeader name={project.name} avatar={project.avatar} coverImage={project.coverImage} />}>
      <ProjectDetails showEditButton={isCurrentUserTeamLead} project={project} />
      <Divider sx={{ my: 2 }} />
      <Typography variant='h6'>Members</Typography>
      <Stack gap={1}>
        {project.projectMembers.map((member) => (
          <FarcasterCard
            fid={member.farcasterUser.fid}
            key={member.farcasterUser.fid}
            name={member.farcasterUser.displayName}
            username={member.farcasterUser.username}
            avatar={member.farcasterUser.pfpUrl}
            bio={member.farcasterUser.bio}
            enableLink
          />
        ))}
      </Stack>
    </PageWrapper>
  );
}
