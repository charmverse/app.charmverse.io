import 'server-only';

import { Divider, Stack, Typography } from '@mui/material';

import { FarcasterCard } from 'components/common/FarcasterCard';
import type { ConnectProjectDetails } from 'lib/projects/getProject';

import { PageWrapper } from '../../common/PageWrapper';
import { ProjectDetails } from '../components/ProjectDetails';
import { ProjectHeader } from '../components/ProjectHeader';

export async function ProjectDetailsPage({ project }: { project: ConnectProjectDetails }) {
  return (
    <PageWrapper header={<ProjectHeader name={project.name} avatar={project.avatar} coverImage={project.coverImage} />}>
      <ProjectDetails project={project} />
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
