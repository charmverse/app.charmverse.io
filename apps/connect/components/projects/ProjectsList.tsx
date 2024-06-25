import 'server-only';

import Typography from '@mui/material/Typography';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

import { getRecentProjectsWithMembers } from 'lib/projects/getRecentProjectsWithMembers';
import { getIronOptions } from 'lib/session/getIronOptions';
import type { SessionData } from 'lib/session/types';

import { ProjectItem } from './ProjectItem';

export async function ProjectsList({ userProjects }: { userProjects?: boolean }) {
  const session = await getIronSession<SessionData>(cookies(), getIronOptions());

  const projectsList = await getRecentProjectsWithMembers({
    userId: userProjects ? session.user?.id : undefined
  });

  if (projectsList.length === 0) {
    return <Typography mt={1}>There are no new projects</Typography>;
  }

  return projectsList.map((project) => {
    return <ProjectItem key={project.id} project={project} />;
  });
}
