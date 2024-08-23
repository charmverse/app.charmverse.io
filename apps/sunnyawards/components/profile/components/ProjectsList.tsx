import 'server-only';

import { getRecentProjectsWithMembers } from '@connect-shared/lib/projects/getRecentProjectsWithMembers';
import { Typography } from '@mui/material';

import { ProjectItem } from './ProjectItem';

export async function ProjectsList({ userId }: { userId?: string }) {
  const projectsList = await getRecentProjectsWithMembers({
    userId
  });

  if (projectsList.length === 0) {
    return <Typography>Create a submission and submit it to the SUNNYs</Typography>;
  }

  return projectsList.map((project) => {
    return <ProjectItem key={project.id} project={project} />;
  });
}
