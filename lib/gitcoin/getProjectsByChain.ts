import { RateLimit } from 'async-sema';

import { getProjectDetails } from './getProjectDetails';
import type { Owners } from './getProjectDetails';
import type { ChainId } from './projectsCount';
import { getProjectCount } from './projectsCount';

export async function getAllProjects() {
  const rateLimiter = RateLimit(1);
  const projectCountByChain = await getProjectCount();
  let owners: Owners = [];

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
      if (projectDetails?.owners && projectDetails.owners.length > 0) {
        owners = [...owners, ...projectDetails.owners]; // TODO: This could be deleted if we create attestations one by one
      }
    }
  }

  // TODO: Create Credentials
}
