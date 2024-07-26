import 'server-only';

import type { ConnectProjectDetails } from '@connect-shared/lib/projects/fetchProject';
import { getSession } from '@connect-shared/lib/session/getSession';
import { Divider, Stack, Typography } from '@mui/material';

import { FarcasterCard } from 'components/common/FarcasterCard';
import { PageCoverHeader } from 'components/common/PageCoverHeader';

import { PageWrapper } from '../../common/PageWrapper';
import { ProjectDetails } from '../components/ProjectDetails';

export async function ProjectDetailsPage({ project }: { project: ConnectProjectDetails }) {
  const session = await getSession();

  const isCurrentUserTeamLead = project.projectMembers.some(
    (member) => member.teamLead && member.userId === session.user.id
  );

  return (
    <PageWrapper
      header={<PageCoverHeader name={project.name} avatar={project.avatar} coverImage={project.coverImage} />}
    >
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
