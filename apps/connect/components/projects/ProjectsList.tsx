import Typography from '@mui/material/Typography';

import { getProjectsWithMembers } from 'lib/projects/getProjectsWithMembers';

import { ProjectItem } from './ProjectItem';

export async function ProjectsList() {
  const projectsList = await getProjectsWithMembers();

  if (projectsList.length === 0) {
    return <Typography mt={1}>There are no new projects</Typography>;
  }

  return projectsList.map((project) => {
    return <ProjectItem key={project.id} project={project} />;
  });
}
