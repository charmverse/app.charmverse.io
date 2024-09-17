import { prisma } from '@charmverse/core/prisma-client';
import { syncProposalPermissionsWithWorkflowPermissions } from '@root/lib/proposals/workflows/syncProposalPermissionsWithWorkflowPermissions';
import { prettyPrint } from 'lib/utils/strings';
import { v4 } from 'uuid';

async function query() {
  const builder = await prisma.scout.create({
    data: {
      displayName: "Safwan Shaheer",
      username: "devorein",
      agreedToTOS: true,
      builder: true,
      githubUser: {
        create: {
          id: 1,
          login: "devorein",
        }
      }
    }
  })

  await prisma.githubRepo.create({
    data: {
      id: v4(),
      name: "app.charmverse.io",
      owner: "charmverse"
    }
  })

  console.log(builder);
}

query();
