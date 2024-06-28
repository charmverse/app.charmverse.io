import { getOpProjects } from 'lib/optimism/getOpProjects';

export async function getOpProjectsByFarcasterId({ farcasterId }: { farcasterId: number }) {
  return getOpProjects();
  // return opProjects.filter((project) => project.team.find((member) => member.farcasterId !== farcasterId.toString()));
}
