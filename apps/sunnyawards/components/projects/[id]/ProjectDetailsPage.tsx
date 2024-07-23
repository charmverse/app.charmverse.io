import 'server-only';

import { getCurrentUserAction } from '@connect-shared/lib/profile/getCurrentUserAction';
import type { ConnectProjectDetails } from '@connect-shared/lib/projects/fetchProject';
import { Divider, Stack, Typography } from '@mui/material';

import { FarcasterCard } from 'components/common/FarcasterCard';

import { PageWrapper } from '../../common/PageWrapper';
import { ProjectDetails } from '../components/ProjectDetails';
import { ProjectHeader } from '../components/ProjectHeader';

export async function ProjectDetailsPage({ project }: { project: ConnectProjectDetails }) {
  const currentUser = await getCurrentUserAction();

  const isCurrentUserTeamLead = project.projectMembers.some(
    (member) => member.teamLead && member.userId === currentUser?.data?.id
  );
  return (
    <PageWrapper header={<ProjectHeader name={project.name} avatar={project.avatar} coverImage={project.coverImage} />}>
      <ProjectDetails project={project} showEditButton={isCurrentUserTeamLead} />
      <Divider sx={{ my: 2 }} />
      <Typography variant='h6'>Members</Typography>
      <Stack gap={1}>
        {project.projectMembers.map((member) => (
          <FarcasterCard
            fid={parseInt(member.farcasterUser.fid.toString())}
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
