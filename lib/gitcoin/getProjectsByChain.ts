import { RateLimit } from 'async-sema';

import { getProjectDetails, type ProjectMetadata } from './getProjectDetails';
import type { ChainId } from './projectsCount';
import { getProjectCount } from './projectsCount';

export async function getAllProjects() {
  const rateLimiter = RateLimit(1);
  const projectCountByChain = await getProjectCount();
  let owners: readonly `0x${string}`[] = [];

  for (const [_chainId, projectsNumber] of Object.entries(projectCountByChain)) {
    const chainId = Number(_chainId) as ChainId;

    for (let i = 1; i <= projectsNumber; i++) {
      if (i === 2) {
        // TODO - remove when done
        break;
        return;
      }
      await rateLimiter();
      const projectDetails = await getProjectDetails({ chainId, projectId: i });
      if (projectDetails?.owners) {
        owners = [...owners, ...projectDetails.owners];
      }
    }
  }

  // TODO: Create Credentials
}
