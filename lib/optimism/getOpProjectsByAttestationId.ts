import { getOpProjects } from 'lib/optimism/getOpProjects';

export async function getOpProjectsByAttestationId({ attestationId }: { attestationId: string }) {
  const opProjects = await getOpProjects();
  return opProjects.find((project) => project.attestationUid === attestationId) ?? null;
}
